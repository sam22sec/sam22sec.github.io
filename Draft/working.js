// ===== GLOBAL VARIABLES =====
let currentView = 'tree';
let graphInitialized = false;
let simulation, svg, g;
let selectedPlatforms = []; // Track which platforms are selected for filtering
let allPlatforms = []; // Store all available platforms from JSON
let manifestData = null; // Store the loaded JSON data for reuse

// ===== VIEW MANAGEMENT =====
function switchView(viewType) {
    // Update active tab
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
    
    // Hide all views
    document.getElementById('graph-container').style.display = 'none';
    document.getElementById('tree-container').style.display = 'none';
    
    // Show selected view
    if (viewType === 'graph') {
        document.getElementById('graph-container').style.display = 'block';
        if (!graphInitialized) {
            initializeGraph();
            graphInitialized = true;
        } else if (manifestData) {
            // If graph already exists, rebuild it with current filters
            rebuildGraph(filterData(manifestData));
        }
    } else {
        document.getElementById('tree-container').style.display = 'block';
        if (manifestData) {
            // Build tree view with current filters
            buildTreeView(filterData(manifestData));
        }
    }
    
    currentView = viewType;
}

// Tab click event listeners
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
        switchView(this.dataset.view);
    });
});

// ===== PLATFORM FILTER FUNCTIONS =====
function createPlatformFilters() {
    const filterContainer = d3.select(".filter-buttons");
    filterContainer.html(""); // Clear existing buttons
    
    // "All Platforms" button
    filterContainer.append("button")
        .attr("class", "filter-btn active")
        .attr("data-platform", "all")
        .text("All Platforms")
        .on("click", function() {
            togglePlatformFilter("all", this);
        });
    
    // Platform-specific buttons
    allPlatforms.forEach(platform => {
        filterContainer.append("button")
            .attr("class", "filter-btn")
            .attr("data-platform", platform)
            .text(platform)
            .on("click", function() {
                togglePlatformFilter(platform, this);
            });
    });
}

function togglePlatformFilter(platform, button) {
    const isAllPlatform = platform === "all";
    const buttonElement = d3.select(button);
    
    if (isAllPlatform) {
        // If "All" is clicked, deselect everything else and select all
        selectedPlatforms = [];
        d3.selectAll(".filter-btn").classed("active", false);
        buttonElement.classed("active", true);
    } else {
        // Toggle this platform
        const index = selectedPlatforms.indexOf(platform);
        if (index === -1) {
            selectedPlatforms.push(platform);
            buttonElement.classed("active", true);
        } else {
            selectedPlatforms.splice(index, 1);
            buttonElement.classed("active", false);
        }
        
        // Update "All" button state
        const allButton = d3.select(".filter-btn[data-platform='all']");
        if (selectedPlatforms.length === 0) {
            allButton.classed("active", true);
        } else {
            allButton.classed("active", false);
        }
    }
    
    // Apply filters to current view
    applyFilters();
}

function filterData(data) {
    if (!data || !data.machines) return { machines: [] };
    
    if (selectedPlatforms.length === 0) {
        // If no platforms selected, show all
        return data;
    }
    
    // Filter machines by selected platforms
    const filteredMachines = data.machines.filter(machine => 
        selectedPlatforms.includes(machine.platform.toUpperCase())
    );
    
    return { machines: filteredMachines };
}

function applyFilters() {
    if (!manifestData) return;
    
    const filteredData = filterData(manifestData);
    
    if (currentView === 'tree') {
        buildTreeView(filteredData);
    } else if (graphInitialized) {
        // Use setTimeout to ensure DOM updates complete before rebuilding graph
        setTimeout(() => {
            rebuildGraph(filteredData);
        }, 50);
    }
}

// ===== DATA LOADING =====
function loadData() {
    d3.json("../scripts/manifest.json")
        .then(function(data) {
            if (!data) throw new Error("Failed to load manifest.json");
            manifestData = data;
            
            // Extract all unique platforms for filter buttons
            allPlatforms = [...new Set(data.machines.map(m => m.platform.toUpperCase()))];
            
            // Create filter buttons
            createPlatformFilters();
            
            // Load initial view with filtered data
            if (currentView === 'tree') {
                buildTreeView(filterData(manifestData));
            } else if (graphInitialized) {
                rebuildGraph(filterData(manifestData));
            }
        })
        .catch(function(error) {
            console.error("Error loading manifest.json:", error);
        });
}

// ===== GRAPH INITIALIZATION =====
function initializeGraph() {
    const width = document.getElementById('graph-container').clientWidth;
    const height = document.getElementById('graph-container').clientHeight;

    // Clear any existing SVG
    d3.select("#graph-container").selectAll("svg").remove();

    // Create the SVG container with zooming
    svg = d3.select("#graph-container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", function (event) {
            g.attr("transform", event.transform);
        }));

    g = svg.append("g");

    // Helper function to determine mobile scaling
    function getMobileScaleFactor() {
        return window.innerWidth < 768 ? 0.6 : 1;
    }

    // Create the force simulation with responsive settings
    simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(function() {
            return Math.min(width, height) * 0.12 * getMobileScaleFactor();
        }))
        .force("charge", d3.forceManyBody().strength(function() {
            return -Math.min(width, height) * 0.35 * getMobileScaleFactor();
        }))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(function(d) {
            return (d.radius + 3) * getMobileScaleFactor();
        }))
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05));

    // Build graph with filtered data
    if (manifestData) {
        buildGraph(filterData(manifestData));
    }
}

function rebuildGraph(data) {
    // Clear existing graph completely
    g.selectAll("*").remove();
    
    // Reset simulation forces
    simulation.nodes([]);
    simulation.force('link').links([]);
    
    // Update container dimensions (CRITICAL for proper positioning)
    const newWidth = document.getElementById('graph-container').clientWidth;
    const newHeight = document.getElementById('graph-container').clientHeight;
    
    svg.attr('width', newWidth)
       .attr('height', newHeight);
    
    // Update simulation center point
    simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
    
    // Rebuild graph with filtered data
    buildGraph(data);
    
    // Force restart simulation with high energy
    simulation.alpha(1).restart();
}

// ===== GRAPH BUILD FUNCTION =====
function buildGraph(data) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // Helper function to get or create a category node
    function getOrCreateNode(id, type, radius = 15) {
        if (!nodeMap.has(id)) {
            const newNode = { id, type, radius };
            nodes.push(newNode);
            nodeMap.set(id, newNode);
        }
        return nodeMap.get(id);
    }

    // Create Platform and Difficulty nodes first
    const platforms = [...new Set(data.machines.map(m => m.platform.toUpperCase()))];
    const difficulties = [...new Set(data.machines.map(m => m.difficulty))]
        .filter(diff => diff);

    platforms.forEach(p => getOrCreateNode(p, "platform", 15));
    difficulties.forEach(d => getOrCreateNode(d, "difficulty", 11));

    // Create Machine nodes and Links
    data.machines.forEach(machine => {
        const machineNode = { 
            id: machine.title, 
            type: "machine", 
            radius: 7, 
            url: machine.url 
        };
        nodes.push(machineNode);
        nodeMap.set(machine.title, machineNode);

        // Link Machine -> Platform
        const platformNode = nodeMap.get(machine.platform.toUpperCase());
        links.push({ source: machineNode.id, target: platformNode.id });

        // Link Machine -> Difficulty
        if (machine.difficulty) {
            const difficultyNode = nodeMap.get(machine.difficulty);
            links.push({ source: machineNode.id, target: difficultyNode.id });
        }
    });

    // Draw links (lines)
    const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1.5);

    // Draw nodes (circles)
    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => d.radius)
        .attr("class", d => d.type)
        .attr("fill", d => {
            if (d.type === "platform") return "#ff6b6b";
            if (d.type === "difficulty") return "#339af0";
            return "#51cf66";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

    // Add titles (tooltips)
    node.append("title")
        .text(d => `${d.id} (${d.type})`);

    // Add click event to open machine pages
    node.filter(d => d.type === "machine")
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            window.open(d.url, '_self');
        });

    // Add labels to all nodes
    const label = g.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", d => {
            if (d.type === "platform") return "15px";
            if (d.type === "difficulty") return "13px";
            return "10px";
        })
        .attr("dx", 20)
        .attr("dy", 4);

    // Update simulation with our data
    simulation.nodes(nodes);
    simulation.force("link").links(links);

    // Update positions on each tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    // Force simulation restart to ensure proper layout
    simulation.alpha(1).restart();

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// ===== RESIZE HANDLER =====
window.addEventListener('resize', function() {
    if (currentView !== 'graph' || !graphInitialized) return;
    
    const newWidth = document.getElementById('graph-container').clientWidth;
    const newHeight = document.getElementById('graph-container').clientHeight;
    
    svg.attr('width', newWidth).attr('height', newHeight);
    
    function getMobileScaleFactor() {
        return window.innerWidth < 768 ? 0.6 : 1;
    }
    
    const scaleFactor = getMobileScaleFactor();
    simulation.force('link').distance(Math.min(newWidth, newHeight) * 0.12 * scaleFactor);
    simulation.force('charge').strength(-Math.min(newWidth, newHeight) * 0.35 * scaleFactor);
    simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
    simulation.force('x', d3.forceX(newWidth / 2).strength(0.05));
    simulation.force('y', d3.forceY(newHeight / 2).strength(0.05));
    simulation.force('collision').radius(function(d) {
        return (d.radius + 3) * scaleFactor;
    });
    
    simulation.alpha(0.5).restart();
});

// ===== TREE VIEW FUNCTION =====
function buildTreeView(data) {
    const treeContainer = d3.select("#tree-container");
    treeContainer.html("");
    
    const platformsContainer = treeContainer.append("div")
        .attr("class", "tree-platforms-container");

    // Group machines by platform
    const platforms = {};
    data.machines.forEach(machine => {
        const platform = machine.platform.toUpperCase();
        if (!platforms[platform]) {
            platforms[platform] = {};
        }
        
        // Only create difficulty group if difficulty exists
        if (machine.difficulty) {
            if (!platforms[platform][machine.difficulty]) {
                platforms[platform][machine.difficulty] = [];
            }
            platforms[platform][machine.difficulty].push(machine);
        } else {
            // Group machines without difficulty directly under platform
            if (!platforms[platform]["_no_difficulty"]) {
                platforms[platform]["_no_difficulty"] = [];
            }
            platforms[platform]["_no_difficulty"].push(machine);
        }
    });

    const platformKeys = Object.keys(platforms).sort();
    
    // Create a separate tree for each platform
    platformKeys.forEach(platform => {
        const platformBox = platformsContainer.append("div")
            .attr("class", "tree-platform-box");

        // Platform header
        platformBox.append("div")
            .attr("class", "tree-platform-header")
            .text(platform);

        const difficultyKeys = Object.keys(platforms[platform]).sort();
        const hasDifficulties = difficultyKeys.some(key => key !== "_no_difficulty");
        
        // Handle machines with difficulties
        if (hasDifficulties) {
            difficultyKeys.forEach((difficulty, difficultyIndex) => {
                if (difficulty === "_no_difficulty") return;
                
                const isLastDifficulty = difficultyIndex === difficultyKeys.length - 1 || 
                                       (difficultyIndex === difficultyKeys.length - 2 && 
                                        difficultyKeys.includes("_no_difficulty"));
                
                // Difficulty line with vertical connector
                platformBox.append("div")
                    .attr("class", "tree-line")
                    .html(`${isLastDifficulty ? '└── ' : '├── '}<span class="tree-difficulty">${difficulty}</span>`);

                const machines = platforms[platform][difficulty];
                const connector = isLastDifficulty ? '    ' : '│   ';
                
                machines.forEach((machine, machineIndex) => {
                    const isLastMachine = machineIndex === machines.length - 1;
                    
                    // Machine line with appropriate connector
                    platformBox.append("div")
                        .attr("class", "tree-line")
                        .html(`${connector}${isLastMachine ? '└── ' : '├── '}<span class="tree-machine">${machine.title}</span>`)
                        .style("cursor", "pointer")
                        .on("click", () => {
                            window.open(machine.url, '_self');
                        });
                });
            });
        }

        // Handle machines without difficulties
        if (platforms[platform]["_no_difficulty"]) {
            const machines = platforms[platform]["_no_difficulty"];
            const isLastGroup = !hasDifficulties;
            
            machines.forEach((machine, machineIndex) => {
                const isLastMachine = machineIndex === machines.length - 1;
                const connector = hasDifficulties ? '└── ' : '';
                
                // Machine line directly under platform
                platformBox.append("div")
                    .attr("class", "tree-line")
                    .html(`${hasDifficulties ? '    ' : ''}${connector}${isLastMachine && !hasDifficulties ? '└── ' : '├── '}<span class="tree-machine">${machine.title}</span>`)
                    .style("cursor", "pointer")
                    .on("click", () => {
                        window.open(machine.url, '_self');
                    });
            });
        }
    });

    // Add message if no data
    if (platformKeys.length === 0) {
        treeContainer.append("div")
            .attr("class", "tree-line")
            .text("No machines found for selected platforms.");
    }
}

// ===== INITIALIZE APP =====
function initializeApp() {
    loadData();
    switchView('tree');
}

// Start the application
initializeApp();