const fs = require("fs");
const readline = require("readline");

let filenames = [];
const dir = "./unzipped/";

// List files in unzipped dir
fs.readdirSync(dir).forEach((filename) => {
    filenames.push(dir + filename);
});

const filename = filenames[0];
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

function noColorLength(string) {
    return string.replace(/\x1b\[[0-9;]*m/g, "").length;
}

function surfaceInfo(surface) {
    let resources = [];
    let resourceKeys = Object.keys(surface.resource).sort((a, b) => {
        return surface.resource[b] - surface.resource[a];
    });
    for (let i = 0; i < Math.min(6, resourceKeys.length); i++) {
        resources.push(rename(resourceKeys[i]));
        resources.push(Math.floor(surface.resource[resourceKeys[i]] * 10000) / 10000);
    }
    return [
        surface.name,
        surface.delta_v,
        surface.zone_type,
        surface.tags.enemy,
        surface.tags.water,
        ...resources,
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

file.on("line", (line) => {
    let seedObject = JSON.parse(line);
    const modules = seedObject.loot.join("");
    if (modules.match(/^PPSS/)) {
        console.log(`seed: ${seedObject.seed} modules: ${modules}`);
        const planetsAndMoons = [...seedObject.moons, ...seedObject.planets].sort((a, b) => {
            return a.delta_v - b.delta_v;
        });
        let table = [];
        for (let i = 0; i < planetsAndMoons.length; i++) {
            table.push(surfaceInfo(planetsAndMoons[i]));
        }
        printTable(table);
        process.exit(0);
    }
});
