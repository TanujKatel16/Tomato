import prisma from "./config/db.js";

try {
    // CREATE
    const user = await prisma.user.create({
        data: {
            name: "Tanuj",
            email: "tanuj@example.com",
            password: "temporary-password"
        }
    });

    console.log("Created:", user);

    // READ
    const users = await prisma.user.findMany();

    console.log("All users:", users);

    // UPDATE
    const updatedUser = await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            name: "Tanuj Katel"
        }
    });

    console.log("Updated:", updatedUser);

    // DELETE
    await prisma.user.delete({
        where: {
            id: user.id
        }
    });

    console.log("User deleted");
} catch (error) {
    console.error(error);
} finally {
    await prisma.$disconnect();
}