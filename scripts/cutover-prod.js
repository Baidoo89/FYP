const { execSync } = require('child_process')
const { Client } = require('pg')

const args = new Set(process.argv.slice(2))
const checkOnly = args.has('--check-only')
const skipBuild = args.has('--skip-build')
const skipConnect = args.has('--skip-connect')

function fail(message) {
  console.error(`\n❌ ${message}`)
  process.exit(1)
}

function run(command, envOverrides = {}) {
  console.log(`\n> ${command}`)
  execSync(command, {
    stdio: 'inherit',
    env: { ...process.env, ...envOverrides },
  })
}

function maskedUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.password) parsed.password = '***'
    return parsed.toString()
  } catch {
    return '<invalid-url>'
  }
}

async function testDatabaseConnection(connectionString) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  const result = await client.query(
    'select current_database() as database, current_user as user_name'
  )
  await client.end()

  const row = result.rows[0]
  console.log(
    `✅ Connected to database "${row.database}" as "${row.user_name}"`
  )
}

async function verifyPostDeploy(connectionString) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  const tableResult = await client.query(
    "select count(*)::int as table_count from information_schema.tables where table_schema = 'public'"
  )
  await client.end()

  console.log(`✅ Public tables detected: ${tableResult.rows[0].table_count}`)
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    fail('DATABASE_URL is missing. Set your Neon connection string before running cutover.')
  }

  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    fail('DATABASE_URL must be a PostgreSQL URL for Neon cutover.')
  }

  if (!/sslmode=require/i.test(databaseUrl)) {
    fail('DATABASE_URL must include sslmode=require for Neon.')
  }

  const runtimeEnv = process.env.NODE_ENV || 'production'
  console.log(`🚀 Starting production cutover with NODE_ENV=${runtimeEnv}`)
  console.log(`🔐 Using DATABASE_URL=${maskedUrl(databaseUrl)}`)

  if (!skipConnect) {
    console.log('\n🔎 Preflight: testing Neon connectivity')
    await testDatabaseConnection(databaseUrl)
  }

  console.log('\n🔎 Preflight: validating Prisma PostgreSQL schema')
  run('npx prisma validate --schema prisma/schema.postgres.prisma')

  if (checkOnly) {
    console.log('\n✅ Preflight checks completed (check-only mode).')
    return
  }

  run('npx prisma generate --schema prisma/schema.postgres.prisma')
  run('npx prisma migrate deploy --schema prisma/schema.postgres.prisma')

  if (!skipBuild) {
    run('npm run build', { NODE_ENV: 'production' })
  }

  console.log('\n🔎 Post-deploy: checking migration status')
  run('npx prisma migrate status --schema prisma/schema.postgres.prisma')

  if (!skipConnect) {
    console.log('\n🔎 Post-deploy: verifying database access')
    await verifyPostDeploy(databaseUrl)
  }

  console.log('\n✅ Production cutover completed successfully.')
}

main().catch((error) => {
  console.error('\n❌ Production cutover failed.')
  console.error(error.message || error)
  process.exit(1)
})