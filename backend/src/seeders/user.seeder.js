import bcrypt from "bcrypt";
import User from "../models/user.model.js";

// Shared across every seeded account, per your instructions.
const SHARED_PASSWORD = "Pass@123";
const SHARED_IS_VERIFIED = true;
const SHARED_ASSOCIATION = null;

// One account per role, following the "Juan {Role}" naming pattern.
const USERS_TO_SEED = [
    { fullname: "Juan Far", email: "far@gmail.com", role: "far" },
    { fullname: "Juan Aew", email: "aew@gmail.com", role: "aew" },
    { fullname: "Juan Coordinator", email: "coordinator@gmail.com", role: "coordinator" },
    { fullname: "Juan Governor", email: "governor@gmail.com", role: "governor" },
    { fullname: "Juan Head", email: "head@gmail.com", role: "head" },
    { fullname: "Juan Admin", email: "admin@gmail.com", role: "admin" },
];

const SALT_ROUNDS = 10;

// Wipes the User collection. Called by dbSeeder before seedUsers() so
// every run starts from a clean slate rather than accumulating dupes.
export const wipeUsers = async () => {
    const result = await User.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} user(s).`);
};

// No foreign-key dependencies — every seeded user has association: null,
// per your instructions.
export const seedUsers = async () => {
    const hashedPassword = await bcrypt.hash(SHARED_PASSWORD, SALT_ROUNDS);
    const users = [];

    for (const userData of USERS_TO_SEED) {
        const user = await User.create({
            fullname: userData.fullname,
            email: userData.email,
            password: hashedPassword,
            isVerified: SHARED_IS_VERIFIED,
            role: userData.role,
            association: SHARED_ASSOCIATION,
        });

        users.push(user);
        console.log(`  Seeded: ${user.fullname} <${user.email}> (${user.role})`);
    }

    return { users };
};