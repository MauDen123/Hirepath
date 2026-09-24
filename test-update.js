const { prisma } = require('./src/lib/prisma');

async function testUpdate() {
  try {
    const userId = 'cmu3uo59p0007e8tay7jp63mf';
    console.log('Testing direct Prisma update for user:', userId);
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Juana D. Cruz Updated',
        email: 'juana.cruz.updated@example.com',
        age: 25,
        gender: 'Female',
        address: '123 Test Street Updated'
      }
    });
    
    console.log('Update successful:', {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      address: updatedUser.address
    });
  } catch (error) {
    console.error('Update failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();
