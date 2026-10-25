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
        position: "secretary",
    },
    {
        lastName: "Reyes",
        firstName: "Bayani",
        contactNumber: "09171234503",
        emailAddress: "bayani.reyes@gmail.com",
        gender: "male",
        birthDate: "1980-11-03",
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
        position: "vice_president",
    },
    {
        lastName: "Marasigan",
        firstName: "Teresita",
        contactNumber: "09171234506",
        emailAddress: "teresita.marasigan@gmail.com",
        gender: "female",
        birthDate: "1984-12-30",
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
        position: "member",
    },
    {
        lastName: "Castillo",
        firstName: "Danilo",
        contactNumber: "09171234509",
        emailAddress: "danilo.castillo@gmail.com",
        gender: "male",
        birthDate: "1978-10-08",
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
        position: "member",
    },
    {
        lastName: "Cruz",
        firstName: "Josefina",
        contactNumber: "09171234512",
        emailAddress: "josefina.cruz@gmail.com",
        gender: "female",
        birthDate: "1982-04-27",
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
        position: "director",
    },
];

export const wipeFarmers = async () => {
    const result = await Farmer.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} farmer(s).`);
};

// Requires associations to already exist (context.associations) so every
// farmer's `association` FK points at a real document.
export const seedFarmers = async ({ associations, maintenance } = {}) => {
    if (!maintenance?.municipalities?.length || !maintenance?.barangays?.length) throw new Error("seedFarmers requires Maintenance to already be seeded");
    if (!associations?.length) {
        throw new Error("seedFarmers requires associations to already be seeded");
    }

    const farmers = [];

    for (let i = 0; i < FARMERS_TO_SEED.length; i++) {
        const data = FARMERS_TO_SEED[i];
        // Distribute farmers across the seeded associations round-robin.
        const association = associations[i % associations.length];
        const municipality = maintenance.municipalities.find((item) => String(item._id) === String(association.municipality));
        const barangay = maintenance.barangays.find((item) => String(item._id) === String(association.barangay));
        if (!municipality || !barangay || String(barangay.municipality) !== String(municipality._id)) throw new Error(`seedFarmers: invalid location for ${association.name}`);

        const farmer = await Farmer.create({
            ...data,
            municipality: municipality._id,
            barangay: barangay._id,
            street: "",
            address: `${barangay.name}, ${municipality.name}`,
            association: association._id,
        });

        farmers.push(farmer);
        console.log(`  Seeded: ${farmer.getFullName()} -> ${association.name}`);
    }

    return { farmers };
};
