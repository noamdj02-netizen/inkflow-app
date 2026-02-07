const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const allUsers = await prisma.user.findMany()
  console.log("Connexion réussie ! Voici les utilisateurs :", allUsers)
}

main()
  .catch((e) => console.error("Erreur de connexion :", e))
  .finally(async () => await prisma.$disconnect())