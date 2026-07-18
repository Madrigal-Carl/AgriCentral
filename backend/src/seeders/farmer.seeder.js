import Farmer from "../models/farmer.model.js";

const FARMERS_TO_SEED = [
    {
        lastName: "Dela Cruz",
        firstName: "Pedro",
        middleName: "Santos",
        contactNumber: "09171234567",
        emailAddress: "pedro.delacruz@gmail.com",
        gender: "male",
        birthDate: "1985-04-12",
        address: "Brgy. San Isidro, Nueva Ecija",
        position: "member",
    },
    {
        lastName: "Reyes",
        firstName: "Maria",
        middleName: "Garcia",
        contactNumber: "09181234567",
        emailAddress: "maria.reyes@gmail.com",
        gender: "female",
        birthDate: "1990-08-23",
        address: "Brgy. San Isidro, Nueva Ecija",
        position: "member",
    },
    {
        lastName: "Santos",
        firstName: "Jose",
        contactNumber: "09191234567",
        emailAddress: "jose.santos@gmail.com",
        gender: "male",
        birthDate: "1978-01-30",
        address: "Brgy. Mabuhay, Bulacan",
        position: "member",
    },
    {
        lastName: "Garcia",
        firstName: "Ana",
        middleName: "Lopez",
        contactNumber: "09201234567",
        emailAddress: "ana.garcia@gmail.com",
        gender: "female",
        birthDate: "1995-11-05",
        address: "Brgy. Mabuhay, Bulacan",
        position: "member",
    },
];

export const wipeFarmers = async () => {
    const result = await Farmer.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} farmer(s).`);
};

// Requires associations to already exist (context.associations) so every
// farmer's `association` FK points at a real document.
export const seedFarmers = async ({ associations } = {}) => {
    if (!associations?.length) {
        throw new Error("seedFarmers requires associations to already be seeded");
    }

    const farmers = [];

    for (let i = 0; i < FARMERS_TO_SEED.length; i++) {
        const data = FARMERS_TO_SEED[i];
        // Distribute farmers across the seeded associations round-robin.
        const association = associations[i % associations.length];

        const farmer = await Farmer.create({
            ...data,
            association: association._id,
        });

        farmers.push(farmer);
        console.log(`  Seeded: ${farmer.getFullName()} -> ${association.name}`);
    }

    return { farmers };
};