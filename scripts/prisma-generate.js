const { execSync } = require('child_process')

function run(command) {
  console.log(`> ${command}`)
  execSync(command, {
    stdio: 'inherit',
    env: process.env,
  })
}

const isProductionBuild =
  process.env.PRISMA_SCHEMA === 'postgres' ||
  process.env.VERCEL === '1' ||
  process.env.NODE_ENV === 'production'

const schemaPath = isProductionBuild
  ? 'prisma/schema.postgres.prisma'
  : 'prisma/schema.prisma'

console.log(`Generating Prisma client from ${schemaPath}`)
run(`npx prisma generate --schema ${schemaPath}`)
