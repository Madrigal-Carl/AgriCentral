import Farmer from "../models/farmer.model.js";

const FARMERS_TO_SEED = [
    {
        lastName: "Dela Cruz",
        firstName: "Ramon",
        middleName: "Ibañez",
        contactNumber: "09171234501",
        emailAddress: "ramon.delacruz@gmail.com",
        gender: "male",
        birthDate: "1972-02-14",
        address: "Sitio Malabaybay, Brgy. Agot, Boac, Marinduque",
        position: "president",
    },
    {
        lastName: "Manalo",
        firstName: "Liza",
        middleName: "Faustino",
        contactNumber: "09171234502",
        emailAddress: "liza.manalo@gmail.com",
        gender: "female",
        birthDate: "1988-06-21",
        address: "Sitio Kanluran, Brgy. Isok I, Boac, Marinduque",
        position: "secretary",
    },
    {
        lastName: "Reyes",
        firstName: "Bayani",
        contactNumber: "09171234503",
        emailAddress: "bayani.reyes@gmail.com",
        gender: "male",
        birthDate: "1980-11-03",
        address: "Sitio Dulong Bayan, Brgy. Laylay, Boac, Marinduque",
        position: "treasurer",
    },
    {
        lastName: "Villanueva",
        firstName: "Corazon",
        middleName: "Nepomuceno",
        contactNumber: "09171234504",
        emailAddress: "corazon.villanueva@gmail.com",
        gender: "female",
        birthDate: "1993-09-17",
        address: "Sitio Ibaba, Brgy. Mansiwat, Boac, Marinduque",
        position: "member",
    },
    {
        lastName: "Santos",
        firstName: "Eduardo",
        middleName: "Marasigan",
        contactNumber: "09171234505",
        emailAddress: "eduardo.santos@gmail.com",
        gender: "male",
        birthDate: "1975-05-09",
        address: "Sitio Look, Brgy. Tumagabok, Boac, Marinduque",
        position: "vice_president",
    },
    {
        lastName: "Marasigan",
        firstName: "Teresita",
        contactNumber: "09171234506",
        emailAddress: "teresita.marasigan@gmail.com",
        gender: "female",
        birthDate: "1984-12-30",
        address: "Sitio Wawa, Brgy. Balimbing, Boac, Marinduque",
        position: "member",
    },
    {
        lastName: "Morales",
        firstName: "Fernando",
        middleName: "Olan",
        contactNumber: "09171234507",
        emailAddress: "fernando.morales@gmail.com",
        gender: "male",
        birthDate: "1969-07-25",
        address: "Sitio Pulo, Brgy. Boi, Boac, Marinduque",
        position: "auditor",
    },
    {
        lastName: "Aguilar",
        firstName: "Rosario",
        middleName: "Panganiban",
        contactNumber: "09171234508",
        emailAddress: "rosario.aguilar@gmail.com",
        gender: "female",
        birthDate: "1991-03-11",
        address: "Sitio Kanto, Brgy. Catubugan, Boac, Marinduque",
        position: "member",
    },
    {
        lastName: "Castillo",
        firstName: "Danilo",
        contactNumber: "09171234509",
        emailAddress: "danilo.castillo@gmail.com",
        gender: "male",
        birthDate: "1978-10-08",
        address: "Sitio Baybayin, Brgy. Poctoy, Boac, Marinduque",
        position: "pio",
    },
    {
        lastName: "Navarro",
        firstName: "Imelda",
        middleName: "Quiambao",
        contactNumber: "09171234510",
        emailAddress: "imelda.navarro@gmail.com",
        gender: "female",
        birthDate: "1996-01-19",
        address: "Sitio Bundok, Brgy. Mataas na Bayan, Boac, Marinduque",
        position: "member",
    },
    {
        lastName: "Ramos",
        firstName: "Antonio",
        middleName: "Beringuel",
        contactNumber: "09171234511",
        emailAddress: "antonio.ramos@gmail.com",
        gender: "male",
        birthDate: "1987-08-04",
        address: "Sitio Ilaya, Brgy. Tabi, Boac, Marinduque",
        position: "member",
    },
    {
        lastName: "Cruz",
        firstName: "Josefina",
        contactNumber: "09171234512",
        emailAddress: "josefina.cruz@gmail.com",
        gender: "female",
        birthDate: "1982-04-27",
        address: "Sitio Bagumbayan, Brgy. Daig, Boac, Marinduque",
        position: "project_manager",
    },
    {
        lastName: "Torres",
        firstName: "Rogelio",
        middleName: "Sarmiento",
        contactNumber: "09171234513",
        emailAddress: "rogelio.torres@gmail.com",
        gender: "male",
        birthDate: "1965-12-02",
        address: "Sitio Dulong Bayan, Brgy. Laylay, Boac, Marinduque",
        position: "member",
    },
    {
        lastName: "Bautista",
        firstName: "Marilou",
        middleName: "Escobido",
        contactNumber: "09171234514",
        emailAddress: "marilou.bautista@gmail.com",
        gender: "female",
        birthDate: "1990-02-06",
        address: "Sitio Ibaba, Brgy. Mansiwat, Boac, Marinduque",
        position: "director",
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