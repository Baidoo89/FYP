const { execSync } = require('child_process')

function run(command) {
  console.log(`> ${command}`)
  execSync(command, {
    stdio: 'inherit',
    env: process.env,
  })
}

const databaseUrl = process.env.DATABASE_URL || ''
const schemaPath = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
  ? 'prisma/schema.postgres.prisma'
  : 'prisma/schema.prisma'

console.log(`Generating Prisma client from ${schemaPath}`)
run(`npx prisma generate --schema ${schemaPath}`)
