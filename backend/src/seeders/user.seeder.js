import bcrypt from "bcrypt";
import User from "../models/user.model.js";

// Shared across every seeded account, per your instructions.
const SHARED_PASSWORD = "Pass@123";
const SHARED_IS_VERIFIED = true;

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

// Depends on Associations having already been seeded (see dbSeeder.js
// ordering) so the "far" user can be assigned a real association id
// instead of null. Every other role keeps association: null, per your
// original instructions — only "far" needs one, since requests are
// scoped by the requester's own association.
export const seedUsers = async ({ associations = [] } = {}) => {
    const hashedPassword = await bcrypt.hash(SHARED_PASSWORD, SALT_ROUNDS);
    const users = [];

    const randomAssociationId = () => {
        if (associations.length === 0) return null;
        const pick = associations[Math.floor(Math.random() * associations.length)];
        return pick._id;
    };

    for (const userData of USERS_TO_SEED) {
        const association =
            userData.role === "far" ? randomAssociationId() : null;

        const user = await User.create({
            fullname: userData.fullname,
            email: userData.email,
            password: hashedPassword,
            isVerified: SHARED_IS_VERIFIED,
            role: userData.role,
            association,
        });

        users.push(user);
        console.log(`  Seeded: ${user.fullname} <${user.email}> (${user.role})`);
    }

    return { users };
};