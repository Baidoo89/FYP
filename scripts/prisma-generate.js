const { execSync } = require('child_process')
const path = require('path')

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

const prismaCli = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js')
run(`"${process.execPath}" "${prismaCli}" generate --schema ${schemaPath}`)
