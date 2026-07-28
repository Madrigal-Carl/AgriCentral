import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";

const SHARED_PASSWORD = "Pass@123";
const SHARED_IS_VERIFIED = true;

const USERS_TO_SEED = [
    { fullname: "Juan Far", email: "far@gmail.com", role: "far" },
    { fullname: "Juan Aew", email: "aew@gmail.com", role: "aew" },
    { fullname: "Juan Coordinator", email: "coordinator@gmail.com", role: "coordinator" },
    { fullname: "Juan Governor", email: "governor@gmail.com", role: "governor" },
    { fullname: "Juan Head", email: "head@gmail.com", role: "head" },
    { fullname: "Juan Admin", email: "admin@gmail.com", role: "admin" },
];

const SALT_ROUNDS = 10;

export const wipeUsers = async () => {
    const result = await User.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} user(s).`);
};

export const seedUsers = async ({ associations = [] } = {}) => {
    const hashedPassword = await bcrypt.hash(SHARED_PASSWORD, SALT_ROUNDS);
    const users = [];

    for (const userData of USERS_TO_SEED) {
        const user = await User.create({
            fullname: userData.fullname,
            email: userData.email,
            password: hashedPassword,
            isVerified: SHARED_IS_VERIFIED,
            role: userData.role,
        });

        users.push(user);
        console.log(`  Seeded: ${user.fullname} <${user.email}> (${user.role})`);
    }

    const farUser = users.find((u) => u.role === "far");
    if (farUser && associations.length > 0) {
        const [association] = associations;
        await Association.findByIdAndUpdate(association._id, { $set: { user: farUser._id } });
        console.log(`  Assigned ${farUser.fullname} to association: ${association.name}`);
    }

    return { users };
};