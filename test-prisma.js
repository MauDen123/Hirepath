// Test Prisma client initialization and user update
const { prisma } = require('./src/lib/prisma');
console.log('Prisma from lib/prima.ts:', prisma ? 'initialized' : 'null');

if (prisma) {
  // Try a simple query
  prisma.$connect()
    .then(() => {
      console.log('Connected to database');
      // Test updating user profile
      const userId = 'cmu3uo59p0007e8tay7jp63mf';
      return prisma.user.update({
        where: { id: userId },
        data: {
          name: 'Juana D. Cruz Test Update',
          email: 'juana.cruz.test@example.com',
          age: 25,
          gender: 'Female',
          address: '123 Test Street'
        }
      });
    })
    .then(updatedUser => {
      console.log('User update successful:', {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        age: updatedUser.age,
        gender: updatedUser.gender,
        address: updatedUser.address
      });
      // Verify the update by reading the user back
      return prisma.user.findUnique({ where: { id: userId } });
    })
    .then(user => {
      console.log('Verified user data:', {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        address: user.address
      });
      return prisma.$disconnect();
    })
    .catch(err => {
      console.error('Error:', err);
      return prisma.$disconnect();
    })
    .then(() => {
      process.exit(0);
    });
} else {
  console.error('Prisma client is null');
  process.exit(1);
}
