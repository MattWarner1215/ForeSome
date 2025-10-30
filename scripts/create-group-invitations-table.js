const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createGroupInvitationsTable() {
  try {
    console.log('Creating GroupInvitation table...')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GroupInvitation" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "groupId" TEXT NOT NULL,
        "inviterId" TEXT NOT NULL,
        "inviteeId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "GroupInvitation_groupId_fkey" FOREIGN KEY ("groupId")
          REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "GroupInvitation_inviterId_fkey" FOREIGN KEY ("inviterId")
          REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "GroupInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId")
          REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `)

    console.log('Creating unique constraint...')
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "GroupInvitation_groupId_inviteeId_key"
      ON "GroupInvitation"("groupId", "inviteeId");
    `)

    console.log('Creating indexes...')
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "GroupInvitation_inviteeId_status_idx"
      ON "GroupInvitation"("inviteeId", "status");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "GroupInvitation_groupId_status_idx"
      ON "GroupInvitation"("groupId", "status");
    `)

    console.log('✅ GroupInvitation table created successfully!')
  } catch (error) {
    console.error('Error creating table:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createGroupInvitationsTable()
