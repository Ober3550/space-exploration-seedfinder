const fs = require("fs");
const readline = require("readline");

let filenames = [];
const dir = "./unzipped/";

// List files in unzipped dir
fs.readdirSync(dir).forEach((filename) => {
    filenames.push(dir + filename);
});

const filename = filenames[2];
const file = readline.createInterface({
    input: fs.createReadStream(filename),
    output: process.stdout,
    terminal: false,
});

const COLOR = {
    RESET: "\u001b[0m",
    BLACK: "\u001b[30m",
    WHITE: "\u001b[37m",
    RED: "\u001b[31m",
    GREEN: "\u001b[32m",
    BLUE: "\u001b[34m",
    YELLOW: "\u001b[33m",
    CYAN: "\u001b[36m",
    MAGENTA: "\u001b[35m",
};

const nameMap = {
    "iron-ore": "iron",
    "copper-ore": "copper",
    "crude-oil": "oil",
    "uranium-ore": "uranium",
    "se-cryonite": `${COLOR.BLUE}cryonite${COLOR.RESET}`,
    "se-vulcanite": `${COLOR.RED}vulcanite${COLOR.RESET}`,
    "se-vitamelange": `${COLOR.GREEN}vitamelange${COLOR.RESET}`,
    "se-iridium-ore": `${COLOR.YELLOW}iridium${COLOR.RESET}`,
    "se-holmium-ore": `${COLOR.MAGENTA}holmium${COLOR.RESET}`,
    "se-beryllium-ore": `${COLOR.CYAN}beryl${COLOR.RESET}`,
};
function rename(oldName) {
    if (nameMap[oldName]) {
        return nameMap[oldName];
    }
    return oldName;
}

function noColorString(string) {
    return string.replace(/\x1b\[[0-9;]*m/g, "");
}

function noColorLength(string) {
    return noColorString(string).length;
}

function resourcesArray(resourcesObject) {
    let resources = [];
    let resourceKeys = Object.keys(resourcesObject).sort((a, b) => {
        return resourcesObject[b] - resourcesObject[a];
    });
    for (let i = 0; i < Math.min(6, resourceKeys.length); i++) {
        resources.push(resourceKeys[i]);
        resources.push(Math.floor(resourcesObject[resourceKeys[i]] * 10000) / 10000);
    }
    return resources;
}

function surfaceInfo(surface) {
    return [
        surface.name,
        surface.zone_type[0],
        "dv",
        surface.delta_v,
        "r",
        surface.radius,
        surface.tags.enemy.replace("enemy_", "e ").replace("very_", "v"),
        surface.tags.water.replace("water_", "w "),
        ...resourcesArray(surface.resource).map((x) => rename(x)),
    ];
}

function printTable(table) {
    let columnWidths = [];
    // For each row
    for (let i = 0; i < table.length; i++) {
        // For each column
        for (let j = 0; j < table[i].length; j++) {
            if (!columnWidths[j]) columnWidths[j] = 0;
            if (noColorLength(table[i][j].toString()) > columnWidths[j])
                columnWidths[j] = noColorLength(table[i][j].toString());
        }
    }
    // For each row
    for (let i = 0; i < table.length; i++) {
        let padded = "";
        // For each column
        for (let j = 0; j < table[i].length; j++) {
            let temp = table[i][j];
            // Add padding according to the calculated column widths
            temp += " ".repeat(columnWidths[j] - noColorLength(temp.toString()));
            // Add an extra space between items
            padded += temp + " ";
        }
        console.log(padded);
    }
}

function printPlanetsAndMoons(planetsAndMoons) {
    let table = [];
    for (let i = 0; i < planetsAndMoons.length; i++) {
        table.push(surfaceInfo(planetsAndMoons[i]));
    }
    printTable(table);
}

const resourceNames = {
    "se-vulcanite": true,
    "se-cryonite": true,
    "se-holmium-ore": true,
    "se-beryllium-ore": true,
    "se-iridium-ore": true,
    "se-vitamelange": true,
};
function evalSeed(seedObject) {
    let planets = seedObject.planets.sort((a, b) => {
        return a.delta_v - b.delta_v;
    });
    let moons = seedObject.moons.sort((a, b) => {
        return a.delta_v - b.delta_v;
    });
    let planetsAndMoons = [...planets, ...moons].sort((a, b) => {
        return a.delta_v - b.delta_v;
    });
    // const distanceFilter = planets[3].delta_v;
    // planetsAndMoons = planetsAndMoons.filter((surface) => {
    //     return surface.delta_v <= distanceFilter;
    // });
    planetsAndMoons = planetsAndMoons.filter((surface) => {
        let resources = resourcesArray(surface.resource);
        return (
            surface.tags.water != "water_none" &&
            resourceNames[noColorString(resources[0])] &&
            surface.radius > 2000
        );
    });
    let specialHolm = planetsAndMoons.filter((surface) => {
        let resources = resourcesArray(surface.resource);
        return (
            resources.includes("se-cryonite") &&
            resources.includes("se-vulcanite") &&
            resources.includes("se-holmium-ore")
        );
    });
    if (specialHolm.length > 0) {
        console.log(`seed: ${seedObject.seed} loot: ${seedObject.loot.join("")}`);
        printPlanetsAndMoons(planetsAndMoons);
    }
    return null;
}

file.on("line", (line) => {
    let seedObject = JSON.parse(line);
    const modules = seedObject.loot.join("");
    if (modules.match(/^PPSS/)) {
        let result = evalSeed(seedObject);
        if (result) {
            // Do something with a successful seed
        }
        // process.exit(0);
    }
});
