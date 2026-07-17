export const FARMERS = [
    {
        id: "FR-001",
        name: "Lina Okoro",
        contact: "+254 712 345 678",
        email: "lina.okoro@agricentral.io",
        gender: "female",
        dob: "1988-04-12",
        address: "Plot 12, Kisumu Rd, Nairobi",
        status: "active",
        position: "president",
        farms: ["Greenfield Farm", "Sunrise Acres", "Riverbend Estate"],
        livestock: ["LS-001 · Cow #A-204"],
        equipment: ["EQ-002 · Harvester H-12"],
        history: [
            { kind: "livestock", action: "Received", item: "LS-001 · Cow #A-204", date: "2022-05-01" },
            { kind: "equipment", action: "Received", item: "EQ-002 · Harvester H-12", date: "2021-09-30" },
        ],
    },
    {
        id: "FR-002",
        name: "Samuel Mwangi",
        contact: "+254 700 112 233",
        email: "samuel.m@agricentral.io",
        gender: "male",
        dob: "1985-09-03",
        address: "Block B, Eldoret",
        status: "active",
        position: "president",
        farms: ["Highland Pastures", "Maple Hollow"],
        livestock: ["LS-002 · Goat #G-12"],
        equipment: ["EQ-001 · Tractor T-204"],
        history: [
            { kind: "equipment", action: "Received", item: "EQ-001 · Tractor T-204", date: "2022-04-12" },
            { kind: "livestock", action: "Received", item: "LS-002 · Goat #G-12", date: "2024-06-22" },
        ],
    },
    {
        id: "FR-003",
        name: "Aisha Bello",
        contact: "+234 802 555 0199",
        email: "aisha.bello@agricentral.io",
        gender: "female",
        dob: "1992-11-21",
        address: "Ikeja, Lagos",
        status: "inactive",
        position: "president",
        farms: ["Cedar Ridge"],
        livestock: ["LS-003 · Sheep #S-08"],
        equipment: [],
        history: [
            { kind: "livestock", action: "Received", item: "LS-003 · Sheep #S-08", date: "2023-01-15" },
            { kind: "equipment", action: "Returned", item: "EQ-003 · Plow P-08", date: "2024-02-09" },
        ],
    },
    {
        id: "FR-004",
        name: "Chidi Okafor",
        contact: "+234 813 222 7788",
        email: "chidi.o@agricentral.io",
        gender: "male",
        dob: "1979-02-17",
        address: "Enugu, Nigeria",
        status: "active",
        position: "president",
        farms: ["Willow Creek", "Goldenrod Plains", "Greenfield Farm"],
        livestock: ["LS-004 · Cow #A-117"],
        equipment: ["EQ-004 · Sprayer S-31"],
        history: [
            { kind: "livestock", action: "Received", item: "LS-004 · Cow #A-117", date: "2023-04-05" },
            { kind: "equipment", action: "Received", item: "EQ-004 · Sprayer S-31", date: "2023-01-20" },
        ],
    },
];

export const FARMS = [
    {
        id: "FM-001",
        address: "Brgy. Poblacion, Boac, Marinduque",
        size: 24,
        location: { lat: 13.4456, lng: 121.8403 },
        farmers: ["FR-001 · Lina Okoro", "FR-002 · Samuel Mwangi"],
        crops: [
            { crop: "Rice", status: "growing" },
            { crop: "Maize", status: "planted" },
            { crop: "Vegetables", status: "harvested" },
        ],
        yieldKg: 1250,
        history: [
            { action: "Received", item: "Rice seeds", date: "2024-02-10" },
            { action: "Harvested", item: "Vegetables", date: "2024-09-12" },
        ],
    },
    {
        id: "FM-002",
        address: "Brgy. Mataas na Bayan, Boac, Marinduque",
        size: 58,
        location: { lat: 13.4528, lng: 121.8352 },
        farmers: ["FR-004 · Chidi Okafor"],
        crops: [
            { crop: "Maize", status: "growing" },
            { crop: "Sorghum", status: "growing" },
        ],
        yieldKg: 3200,
        history: [
            { action: "Received", item: "Maize seeds", date: "2024-03-04" },
            { action: "Received", item: "Sorghum seeds", date: "2024-03-04" },
        ],
    },
    {
        id: "FM-003",
        address: "Brgy. Cawit, Boac, Marinduque",
        size: 12,
        location: { lat: 13.4302, lng: 121.8467 },
        farmers: ["FR-006 · Mariam Diallo"],
        crops: [
            { crop: "Vegetables", status: "harvested" },
            { crop: "Cassava", status: "growing" },
        ],
        yieldKg: 890,
        history: [
            { action: "Harvested", item: "Vegetables", date: "2024-08-19" },
        ],
    },
    {
        id: "FM-004",
        address: "Brgy. Tumagabok, Boac, Marinduque",
        size: 32,
        location: { lat: 13.4691, lng: 121.8688 },
        farmers: ["FR-003 · Aisha Bello", "FR-005 · Joseph Kamau"],
        crops: [{ crop: "Coffee", status: "growing" }],
        yieldKg: 0,
        history: [
            { action: "Received", item: "Coffee seedlings", date: "2023-11-20" },
        ],
    },
];

export const LIVESTOCKS = [
    {
        id: "LS-001",
        tag: "Cow #A-204",
        animal: "Cow",
        breed: "Friesian",
        gender: "female",
        dob: "2022-03-14",
        color: "Black & White",
        weight: 480,
        farmer: "Lina Okoro",
        health: "healthy",
        status: "assigned",
        acquisitionDate: "2022-05-01",
        history: [
            { farmer: "Lina Okoro", date: "2022-05-01" },
        ],
    },
    {
        id: "LS-002",
        tag: "Goat #G-12",
        animal: "Goat",
        breed: "Boer",
        gender: "male",
        dob: "2023-01-08",
        color: "Brown",
        weight: 52,
        farmer: "Samuel Mwangi",
        health: "pregnant",
        status: "assigned",
        acquisitionDate: "2023-02-10",
        history: [
            { farmer: "Joseph Kamau", date: "2023-02-10" },
            { farmer: "Samuel Mwangi", date: "2024-06-22" },
        ],
    },
    {
        id: "LS-003",
        tag: "Sheep #S-08",
        animal: "Sheep",
        breed: "Merino",
        gender: "female",
        dob: "2022-09-19",
        color: "White",
        weight: 64,
        farmer: "Aisha Bello",
        health: "sick",
        status: "assigned",
        acquisitionDate: "2023-01-15",
        history: [{ farmer: "Aisha Bello", date: "2023-01-15" }],
    },
    {
        id: "LS-004",
        tag: "Cow #A-117",
        animal: "Cow",
        breed: "Jersey",
        gender: "female",
        dob: "2021-06-02",
        color: "Tan",
        weight: 420,
        farmer: "Chidi Okafor",
        health: "deceased",
        status: "available",
        acquisitionDate: "2021-08-20",
        history: [
            { farmer: "Grace Mensah", date: "2021-08-20" },
            { farmer: "Chidi Okafor", date: "2023-04-05" },
        ],
    },
];

export const EQUIPMENTS = [
    {
        id: "EQ-001",
        name: "Tractor T-204",
        condition: "excellent",
        status: "assigned",
        farmer: "Samuel Mwangi",
        acquisitionDate: "2022-04-12",
        history: [
            { name: "Tractor T-204", date: "2022-04-12" },
        ],
    },
    {
        id: "EQ-002",
        name: "Harvester H-12",
        condition: "good",
        status: "assigned",
        farmer: "Lina Okoro",
        acquisitionDate: "2021-09-30",
        history: [
            { name: "Harvester H-12", date: "2021-09-30" },
        ],
    },
    {
        id: "EQ-003",
        name: "Plow P-08",
        condition: "maintenance",
        status: "available",
        farmer: "",
        acquisitionDate: "2020-06-15",
        history: [{ name: "Plow P-08", date: "2020-06-15" }],
    },
    {
        id: "EQ-004",
        name: "Sprayer S-31",
        condition: "good",
        status: "assigned",
        farmer: "Chidi Okafor",
        acquisitionDate: "2023-01-20",
        history: [{ name: "Sprayer S-31", date: "2023-01-20" }],
    },
];

export const REPORTS = [
    {
        id: "RP-001",
        title: "Maize leaf blight outbreak",
        type: "crop",
        reportedBy: "Lina Okoro",
        role: "far",
        severity: "high",
        status: "open",
        date: "2025-06-18",
        details: "Yellow-brown lesions spreading across the south plot. Affects approximately 1.2 hectares.",
    },
    {
        id: "RP-002",
        title: "Tractor hydraulic leak",
        type: "equipment",
        reportedBy: "Samuel Mwangi",
        role: "far",
        severity: "medium",
        status: "in_review",
        date: "2025-06-15",
        details: "John Deere 5055E losing hydraulic fluid from the front loader cylinder.",
    },
    {
        id: "RP-003",
        title: "Goat showing fever symptoms",
        type: "livestock",
        reportedBy: "Aisha Bello",
        role: "aew",
        severity: "critical",
        status: "open",
        date: "2025-06-20",
        details: "Goat #G-12 has elevated temperature and reduced feeding. Vet visit scheduled.",
    },
    {
        id: "RP-004",
        title: "Irrigation pump failure",
        type: "equipment",
        reportedBy: "Chidi Okafor",
        role: "aew",
        severity: "low",
        status: "resolved",
        date: "2025-05-30",
        details: "Pump motor replaced. System back online.",
    },
];

export const BOAC_CENTER = { lat: 13.4456, lng: 121.8403 };

export const CROP_OPTIONS = [
    "Rice",
    "Maize",
    "Wheat",
    "Vegetables",
    "Coffee",
    "Cocoa",
    "Cassava",
    "Sorghum",
];

export const CROP_STATUS_TONE = {
    planted: "info",
    growing: "success",
    harvested: "neutral",
    fallow: "warning",
};

export const CROP_STATUS_LABEL = {
    planted: "Planted",
    growing: "Growing",
    harvested: "Harvested",
    fallow: "Fallow",
};

export const USERS = [
    {
        id: "US-001",
        fullName: "Daniel Kiprotich",
        email: "daniel.kiprotich@agritrack.io",
        association: "Mogpog",
        role: "far",
        isVerified: true,
    },
    {
        id: "US-002",
        fullName: "Lina Okoro",
        email: "lina.okoro@agritrack.io",
        association: "Boack",
        role: "far",
        isVerified: true,
    },
    {
        id: "US-003",
        fullName: "Samuel Mwangi",
        email: "samuel.mwangi@agritrack.io",
        role: "aew",
        isVerified: true,
    },
    {
        id: "US-004",
        fullName: "Aisha Bello",
        email: "aisha.bello@agritrack.io",
        role: "aew",
        isVerified: true,
    },
    {
        id: "US-005",
        fullName: "Grace Mensah",
        email: "grace.mensah@agritrack.io",
        role: "coordinator",
        isVerified: true,
    },
    {
        id: "US-006",
        fullName: "Ibrahim Sow",
        email: "ibrahim.sow@agritrack.io",
        role: "coordinator",
        isVerified: true,
    },
    {
        id: "US-007",
        fullName: "Helen Adeyemi",
        email: "helen.adeyemi@agritrack.io",
        role: "governor",
        isVerified: true,
    },
    {
        id: "US-008",
        fullName: "Ravi Patel",
        email: "ravi.patel@agritrack.io",
        role: "head",
        isVerified: true,
    },
    // Example: a FAR who self-registered and is awaiting admin approval.
    {
        id: "US-009",
        fullName: "Wanjiru Kamau",
        email: "wanjiru.kamau@agritrack.io",
        role: "far",
        isVerified: false,
    },
];

export const ASSOCIATIONS = [
    {
        id: "AS-001",
        name: "Boac, Marinduque",
        far: "Fe Aquino",
        members: [
            { name: "Ramon Villanueva", position: "President" },
            { name: "Liza Domingo", position: "Vice President" },
            { name: "Miguel Torres", position: "Secretary" },
            { name: "Carmela Rivera", position: "Treasurer" },
            { name: "Jose Ramirez", position: "Member" },
            { name: "Ana Bautista", position: "Member" },
            { name: "Pedro Santos", position: "Member" },
            { name: "Grace Manalo", position: "Member" },
            { name: "Rico Delacruz", position: "Member" },
        ],
    },
    {
        id: "AS-002",
        name: "Mogpog, Marinduque",
        far: "Teresa Lim",
        members: [
            { name: "Corazon Santos", position: "President" },
            { name: "Danilo Cruz", position: "Vice President" },
            { name: "Teresa Lim", position: "Member" },
            { name: "Roberto Diaz", position: "Member" },
            { name: "Marites Ocampo", position: "Member" },
            { name: "Fernando Garcia", position: "Member" },
            { name: "Luz Mercado", position: "Member" },
        ],
    },
    {
        id: "AS-003",
        name: "Santa Cruz, Marinduque",
        far: "Nenita Flores",
        members: [
            { name: "Eduardo Reyes", position: "President" },
            { name: "Josefina Ramos", position: "Vice President" },
            { name: "Bayani Castillo", position: "Secretary" },
            { name: "Nenita Flores", position: "Member" },
            { name: "Arnel Pascual", position: "Member" },
            { name: "Divina Salazar", position: "Member" },
            { name: "Wilfredo Navarro", position: "Member" },
            { name: "Rosalinda Cortez", position: "Member" },
            { name: "Bienvenido Aguilar", position: "Member" },
        ],
    },
    {
        id: "AS-004",
        name: "Torrijos, Marinduque",
        far: "Precious Ventura",
        members: [
            { name: "Marilou Fernandez", position: "President" },
            { name: "Rogelio Ilagan", position: "Secretary" },
            { name: "Precious Ventura", position: "Member" },
            { name: "Armando Salvador", position: "Member" },
            { name: "Cristina Pineda", position: "Member" },
            { name: "Noel Bautista", position: "Member" },
        ],
    },
    {
        id: "AS-005",
        name: "Buenavista, Marinduque",
        far: "Ariel Manansala",
        members: [
            { name: "Antonio Bautista", position: "President" },
            { name: "Leonora Espino", position: "Treasurer" },
            { name: "Ariel Manansala", position: "Member" },
            { name: "Cecilia Domingo", position: "Member" },
            { name: "Rustom Villareal", position: "Member" },
            { name: "Marife Cabrera", position: "Member" },
        ],
    },
    {
        id: "AS-006",
        name: "Gasan, Marinduque",
        far: "Samuel Torres",
        // No president currently assigned for this association.
        members: [
            { name: "Josephine Ramos", position: "Vice President" },
            { name: "Rodel Andrade", position: "Member" },
            { name: "Vicky Villamor", position: "Member" },
            { name: "Samuel Torres", position: "Member" },
            { name: "Bea Marquez", position: "Member" },
            { name: "Isagani Ortiz", position: "Member" },
        ],
    },
];


export const statusTone = {
    active: "success",
    inactive: "neutral",
    assigned: "success",
    reserved: "warning",
    available: "neutral",
    pending: "warning",
    approved: "info",
    fulfilled: "success",
    rejected: "danger",
    open: "warning", in_review: "info", resolved: "success"
};

export const GENDER_OPTIONS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
];

export const ASSOCIATION_OPTIONS = [
    "Boac, Marinduque",
    "Gasan, Marinduque",
    "Buenavista, Marinduque",
    "Mogpog, Marinduque",
    "Santa Cruz, Marinduque",
    "Torrijos, Marinduque",
];

export const POSITION_OPTIONS = [
    { value: "president", label: "President" },
    { value: "vice_president", label: "Vice President" },
    { value: "secretary", label: "Secretary" },
    { value: "treasurer", label: "Treasurer" },
    { value: "auditor", label: "Auditor" },
    { value: "pio", label: "PIO" },
    { value: "project_manager", label: "Project Manager" },
    { value: "director", label: "Board of Directors" },
    { value: "member", label: "Member" },
];

export const FARMER_OPTIONS = [
    "FR-001 · Lina Okoro",
    "FR-002 · Samuel Mwangi",
    "FR-003 · Aisha Bello",
    "FR-004 · Chidi Okafor",
    "FR-005 · Joseph Kamau",
    "FR-006 · Mariam Diallo",
];

export const CROP_STATUS_OPTIONS = [
    { value: "planted", label: "Planted" },
    { value: "growing", label: "Growing" },
    { value: "harvested", label: "Harvested" },
    { value: "withered", label: "Withered" },
    { value: "damaged", label: "Damaged" },
];

export const condTone = {
    excellent: "success",
    good: "info",
    maintenance: "warning",
    damaged: "danger",
    unusable: "neutral",
};

export const condLabel = {
    excellent: "Excellent",
    good: "Good",
    maintenance: "Maintenance",
    damaged: "Damaged",
    unusable: "Unusable",
};

export const EQUIPMENT_CATALOG = [
    "Tractor T-204",
    "Harvester H-12",
    "Plow P-08",
    "Sprayer S-31",
    "Seeder SD-15",
    "Rotavator RV-09",
    "Cultivator C-22",
    "Baler B-17",
    "Irrigation Pump IP-05",
    "Thresher TR-11",
];

export const EQUIPMENT_CONDITION_OPTIONS = [
    { value: "excellent", label: "Excellent" },
    { value: "good", label: "Good" },
    { value: "maintenance", label: "Maintenance" },
    { value: "damaged", label: "Damaged" },
    { value: "unusable", label: "Unusable" },
];

export const STATUS_OPTIONS = [
    { value: "assigned", label: "Assigned" },
    { value: "available", label: "Available" },
];

export const healthTone = {
    healthy: "success",
    pregnant: "info",
    sick: "warning",
    deceased: "danger",
};

export const LIVESTOCK_HEALTH_OPTIONS = [
    { value: "healthy", label: "Healthy" },
    { value: "pregnant", label: "Pregnant" },
    { value: "sick", label: "Sick" },
    { value: "injured", label: "Injured" },
    { value: "deceased", label: "Deceased" },
];

export const LIVESTOCK_CATALOG = [
    { id: "LS-101", animal: "Cow", breed: "Friesian", gender: "female" },
    { id: "LS-102", animal: "Cow", breed: "Jersey", gender: "female" },
    { id: "LS-103", animal: "Cow", breed: "Angus", gender: "male" },
    { id: "LS-104", animal: "Goat", breed: "Boer", gender: "male" },
    { id: "LS-105", animal: "Goat", breed: "Nubian", gender: "female" },
    { id: "LS-106", animal: "Sheep", breed: "Merino", gender: "female" },
    { id: "LS-107", animal: "Sheep", breed: "Dorper", gender: "male" },
    { id: "LS-108", animal: "Pig", breed: "Yorkshire", gender: "female" },
    { id: "LS-109", animal: "Chicken", breed: "Leghorn", gender: "female" },
    {
        id: "LS-110",
        animal: "Chicken",
        breed: "Rhode Island Red",
        gender: "male",
    },
];

export const LIVESTOCK_LIST = [
    "Cow - Friesian (Female) [LS-101]",
    "Cow - Jersey (Female) [LS-102]",
    "Cow - Angus (Male) [LS-103]",
    "Goat - Boer (Male) [LS-104]",
    "Goat - Nubian (Female) [LS-105]",
    "Sheep - Merino (Female) [LS-106]",
    "Sheep - Dorper (Male) [LS-107]",
    "Pig - Yorkshire (Female) [LS-108]",
    "Chicken - Leghorn (Female) [LS-109]",
    "Chicken - Rhode Island Red (Male) [LS-110]",
];

export const ANIMAL_OPTIONS = [
    { value: "Cow", label: "Cow" },
    { value: "Goat", label: "Goat" },
    { value: "Sheep", label: "Sheep" },
    { value: "Pig", label: "Pig" },
    { value: "Chicken", label: "Chicken" },
];

export const typeLabel = {
    equipment: "Equipment", livestock: "Livestock",
    crop: "Crop",
    equipment: "Equipment",
    livestock: "Livestock",
};

export const typeTone = { equipment: "info", livestock: "warning", crop: "success", equipment: "info", livestock: "warning" };

export const sevTone = {
    low: "neutral",
    medium: "info",
    high: "warning",
    critical: "danger",
};

export const sevLabel = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
};

export const SEVERITY_OPTIONS = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
];

export const REQUEST_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "fulfilled", label: "Fulfilled" },
    { value: "rejected", label: "Rejected" },
];

export const TYPE_OPTIONS = [
    { value: "equipment", label: "Equipment" },
    { value: "livestock", label: "Livestock" },
];

export const REPORT_TYPE_OPTIONS = [
    { value: "crop", label: "Crop" },
    { value: "equipment", label: "Equipment" },
    { value: "livestock", label: "Livestock" },
];

export const positionTone = {
    President: "danger",
    "Vice President": "warning",
    Secretary: "info",
    Treasurer: "success",
    Member: "neutral",
};

export const roleLabel = {
    far: "FAR",
    aew: "AEW",
    coordinator: "Coordinator",
    governor: "Governor",
    head: "Head",
};

export const roleTone = {
    far: "info",
    aew: "warning",
    coordinator: "success",
    governor: "purple",
    head: "danger",
};

export const DEFAULT_PASSWORD = "AgriCentral@123";

export const ROLE_OPTIONS = [
    { value: "far", label: "FAR" },
    { value: "aew", label: "AEW" },
    { value: "coordinator", label: "Coordinator" },
    { value: "governor", label: "Governor" },
    { value: "head", label: "Head" },
];

export const positionLabel = {
    president: "President",
    vice_president: "Vice President",
    secretary: "Secretary",
    treasurer: "Treasurer",
    auditor: "Auditor",
    pio: "PIO",
    project_manager: "Project Manager",
    director: "Director",
    member: "Member",
};