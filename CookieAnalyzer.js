const CONSTANTS = {
    adElementSelector: ".ifNoAds",
    bigCookieSelector: "#bigCookie",
    customCSSAttribute: "CA-CSS",
    highlightedAttribute: "highlighted",
    
    containerId: "CAContainer",
    dataContainerId: "CADataContainer",
    mostEfficientId: "CAMostEfficient",
    noMoneyClass: "noMoney",
    efficiencyId : "CAEfficiency",

    autoclickInterval: 5, // ms
    UIRefreshInterval: 500, // ms
    efficiencyFloatPrecision: 6,

    maxWaitTimeDefault: 15, // s

    localStorageName: "CAConfig",
}

class CookieAnalyzer {
    constructor() {
        this.config = {
            autobuy: this.DOM?.autobuy?.checked,
            autoclick: this.DOM?.autoclick?.checked,
            autoclickgolden: this.DOM?.autoclickgolden?.checked,
            maxwaittime: CONSTANTS.maxWaitTimeDefault,
        }

        this.DOM = {
            container: undefined,
            dataContainer: undefined,
            mostEfficient: undefined,
            efficiency: undefined,
            autobuy: undefined,
        }
        
        this.mostEfficientBuilding = this.getMostEfficientBuilding()?.building;

        this.SetupUI();
        this.refreshInterval = setInterval(this.refreshUI.bind(this), CONSTANTS.UIRefreshInterval);
        this.autoclickInterval = undefined;

        console.log('%cCookieAnalyzer correctly initialized', 'color: green; font-size: 40px; font-weight: bold; text-shadow: 2px 2px 0px #000000;');
    }

    // ===== DOM MANIPULATION ======
    //   === UI ===
    refreshUI(){        
        // Get most efficient building
        const mostEfficientBuilding = this.getMostEfficientBuilding();
      	if(!mostEfficientBuilding) return;
        this.mostEfficientBuilding = mostEfficientBuilding.building;

        const canBuyBuilding = this.mostEfficientBuilding.getPrice() <= Game.cookies;
        // It should probably be a button and disable it but is easier to use class toggles
        this.DOM.mostEfficient.classList.toggle("noMoney", !canBuyBuilding);

        this.highlightBuilding(this.mostEfficientBuilding.name);
        this.setMostEfficientText();
        this.setEfficiencyText(mostEfficientBuilding);
        
        if(this.config.autobuy) this.mostEfficientBuilding.buy();
        if(this.config.autoclickgolden) this.autoClickGoldenCoookies();
        this.updateAutoclick();
    }
    
    SetupUI(){
        this.loadConfig();
        
        // Replace tooltip function
        this.setupTooltipExtension();

        // Select and clear parent element
        const adSpace = document.querySelector(CONSTANTS.adElementSelector);
        adSpace.innerHTML = "";

        // Create mod container
        const CAContainer = document.createElement("section");
        CAContainer.classList.add(CONSTANTS.containerId);
        CAContainer.classList.add("title");
        CAContainer.setAttribute("id", CONSTANTS.containerId);
        this.DOM.container = CAContainer;
        CAContainer.innerHTML = `<h2 class="CA-Title">Cookie Analyzer</h2>`;

        // Create data container
        const dataContainer = document.createElement("div");
        dataContainer.classList.add(CONSTANTS.dataContainerId);
        this.DOM.dataContainer = dataContainer;

        // Create buy button
        const mostEfficient = document.createElement("p")
        mostEfficient.classList.add(CONSTANTS.mostEfficientId, "subButton");
        this.DOM.mostEfficient = mostEfficient;
        this.setMostEfficientText(this.mostEfficientBuilding);
        mostEfficient.addEventListener("click", this.buyMostEfficient.bind(this));

        // Create efficiency info
        const efficiency = document.createElement("small");
        efficiency.classList.add(CONSTANTS.efficiencyId);
        this.DOM.efficiency = efficiency;
        this.setEfficiencyText(this.getMostEfficientBuilding());

        // Add checkboxes
        const autoBuyContainer = this.createInput("checkbox", "autobuy", "Autobuy?", "checked");
        const autoClickContainer = this.createInput("checkbox", "autoclick", "Autoclick?", "checked");
        const autoClickGoldenContainer = this.createInput("checkbox", "autoclickgolden", "Autoclick Golden Cookies?", "checked");

        // Add inputs
        const maxWaitContainer = this.createInput("number", "maxwaittime", "Max wait:", "value");

        dataContainer.appendChild(mostEfficient);
        dataContainer.appendChild(efficiency);
        dataContainer.appendChild(autoBuyContainer);
        dataContainer.appendChild(autoClickContainer);
        dataContainer.appendChild(autoClickGoldenContainer);
        dataContainer.appendChild(maxWaitContainer);
        
        CAContainer.appendChild(dataContainer);
        adSpace.appendChild(CAContainer);
    }

    setMostEfficientText(){
      	if(!this.mostEfficientBuilding) return;
      
        const name = this.mostEfficientBuilding.name;
        const timeLeft = Math.floor(this.getSecondsToBuyBuilding(this.mostEfficientBuilding));
        const timeLeftStr = timeLeft ? `(${timeLeft}s left)` : "";
        const str = `Buy: ${name} ${timeLeftStr}`;
        this.DOM.mostEfficient.textContent = str;
    }

    setEfficiencyText(building){
      	if(!building) return;
      
        const str = `Efficiency: ${building.efficiency.toFixed(CONSTANTS.efficiencyFloatPrecision)} CPSPCS`;
        this.DOM.efficiency.textContent = str;
    }

    createInput(type, name, label, valueAccesor){
        const $container = document.createElement("div");
        $container.classList.add("CAInputContainer");
        
        const $label = document.createElement("label");
        $label.textContent = label;
        $label.setAttribute("for", name)
        
        const $input = document.createElement("input")
        $input.type = type;
        $input.name = name;
        $input.setAttribute("id", name);
        this.DOM[name] = $input;
        $input[valueAccesor] = this.config[name];
        $input.classList.add("subButton");
        $input.addEventListener("change", (e) => {
            this.config[name] = e.target[valueAccesor];
            this.writeConfig();
        });

        $container.appendChild($label);
        $container.appendChild($input);

        return $container;
    }

    setupTooltipExtension(){
        // Replaces the run function onmouseover for every store element
        for(let building of Game.ObjectsById){            
            const element = building.l;
            const mouseover = element.getAttribute("onmouseover");
            const tooltipFnString = `Game.ObjectsById[${building.id}].tooltip()`;

            // Failsafe to check if script has already been run
            if(!mouseover.includes(tooltipFnString)) return;

            const [beginning , end] = mouseover.split(tooltipFnString);
            const newMouseover = beginning + `CA.extendTooltip("${building.name}")` + end;
        
            element.setAttribute("onmouseover", newMouseover);
        }
    }

    extendTooltip(buildingName){
        const building = this.getBuildingByID(buildingName);
        const efficiency = this.calculateCPSPCS(buildingName);
        
        const tooltip = building.tooltip();

        // Create new element structure
        const efficiencyString = efficiency.toFixed(CONSTANTS.efficiencyFloatPrecision);
        const efficiencyBlock = this.createTooltipBlock(efficiencyString, " CPSPCS");

        const timeLeftString = Math.floor(this.getSecondsToBuyBuilding(building));
        const timeLeftBlock = this.createTooltipBlock(timeLeftString+"s", " left to afford this.");

        const newBlocks = [
            efficiencyBlock,
            timeLeftBlock,
        ];

        const newBlocksString = newBlocks.map(e => e.outerHTML).join("");

        // Insert newBlock before the last </div> in the tooltip string
        const index = tooltip.lastIndexOf("</div>");
        const ret = tooltip.substring(0, index) + newBlocksString + tooltip.substring(index)

        return ret;
    }

    createTooltipBlock(boldText, text){
        const newBlock = document.createElement("div");
        newBlock.classList.add("descriptionBlock");
        
        const boldElement = document.createElement("b");
        boldElement.textContent = boldText;
        newBlock.appendChild(boldElement);

        newBlock.innerHTML += text;

        return newBlock;
    }
    
    
    //   === BUILDINGS ===
    highlightBuilding(id){
        this.clearBuldingsHighlight();
        
        const buildingToHighlight = this.getBuildingByID(id);
        const element = buildingToHighlight.l;
    
        element.setAttribute(CONSTANTS.highlightedAttribute, "");
    }
    
    clearBuldingsHighlight(){
        for(let building of Game.ObjectsById){
            building.l.removeAttribute(CONSTANTS.highlightedAttribute);
        }
    }
    
    
    // ===== LOGIC =====
    getBuildingByID(id){
        let building;
        if(typeof id === "string")
            building = Game.ObjectsById.find(e => e.name === id);
        if(typeof id === "number")
            building = Game.ObjectsById[id];
        
        if(!building) throw new TypeError("ID passed is not valid");
    
        return building
    }
    
    getAvailableBuildings(){
        const buildings = Game.ObjectsById.filter(e => {
            const isLocked = e.locked;
            // Ignore wait limit if it doesn't exist
            const canBuyInWait = this.config.maxwaittime ? this.getSecondsToBuyBuilding(e) <= Number(this.config.maxwaittime) : true;

            return (!isLocked && canBuyInWait);
        });
        return buildings;
    }

    getBuildingTotalCPS(building){
        return building.storedCps * Game.globalCpsMult;
    }
    
    // CPSPCS: Cookies per second per cookie spent
    // (basically cost efficiency but CPSPCS is funnier)
    calculateCPSPCS(buildingId){
        const building = this.getBuildingByID(buildingId);
    
        const price = building.getPrice();
        const cps = this.getBuildingTotalCPS(building);
    
        return cps / price;
    }
    
    getMostEfficientBuilding(){
        const buildings = this.getBuildingsByEfficiency();
        return buildings[0];
    }

    getBuildingsByEfficiency(){
        const buildings = this.getAvailableBuildings().reduce((acc, building) => {
            const efficiency = this.calculateCPSPCS(building.name);
    
            acc.push({
                building,
                efficiency,
            })
    
            return acc;
        }, [])
    
        const sortedByEfficiency = buildings.sort((a,b) => b.efficiency - a.efficiency);

        return sortedByEfficiency;
    }

    getSecondsToBuyBuilding(building){
        if(Game.cookies >= building.price) return 0;

        const priceDelta = building.price - Game.cookies;
        const timeLeft = priceDelta / Game.cookiesPs;

        return timeLeft;
    }

    buyMostEfficient(){
        this.mostEfficientBuilding.buy();
    }

    autoClickGoldenCoookies(){
        // Probably some better way to do it
        if(Game.shimmers.length){
            for(let shimmer of Game.shimmers){
                shimmer.l.click();
            }
        }
    }

    updateAutoclick(){
        if(this.config.autoclick) {
            if(!this.autoclickInterval) {
                this.setAutoclick();
            }
        } else if(this.autoclickInterval) {
            this.removeAutoClick();
        }
    }
    
    setAutoclick(){
        this.autoclickInterval = setInterval(() => {
            Game.ClickCookie();
        }, CONSTANTS.autoclickInterval);
    }

    removeAutoClick(){
        clearInterval(this.autoclickInterval);
        this.autoclickInterval = undefined;
    }

    // ===== SAVE =====
    writeConfig(){
        localStorage.setItem(CONSTANTS.localStorageName, JSON.stringify(this.config));
    }

    loadConfig(){
        const lsConfig = localStorage.getItem(CONSTANTS.localStorageName);
        if(!lsConfig) return;

        this.config = JSON.parse(lsConfig);
    }
}

// ====== CUSTOM CSS ======
(function addCustomStyles(){
    document
        .querySelectorAll(`style[${CONSTANTS.customCSSAttribute}]`)
        .forEach(e => e.remove());
    
    const styles = document.createElement("style");
    styles.type = "text/css";
    styles.setAttribute(CONSTANTS.customCSSAttribute, "");
    styles.innerHTML += `
    .product[${CONSTANTS.highlightedAttribute}]{ 
        box-shadow: 0px 0px 1rem 5px yellow; 
        z-index: 1000;
        transition: box-shadow 0.25s ease;
    }
    .ifNoAds {
        display: block !important;
        opacity: 1 !important;
        background: rgba(0,0,0,0.4) !important;
        padding: 0 !important;
    }

    .CAContainer {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;

        padding-block: 1rem;
        background: url(img/panelHorizontal.png?v=2) repeat-x bottom;
    }
    
    .CAMostEfficient{
        cursor: pointer;
        margin: 0.5rem;
    }
    .CAMostEfficient:hover{
        filter: brightness(0.5);
    }
    .CAMostEfficient.noMoney{
        filter: brightness(0.5);
        text-decoration: line-through;
        cursor: not-allowed;
    }
    
    .CADataContainer {
        font-size: 1rem;

        margin: 1rem;
    }
    
    .CAContainer .subButton{
        position: initial;
        background-color: rgba(0,0,0,0.2);
        color: white;
    }
    
    .CAEfficiency {
        display:block;
        color: #aaa;
        margin: 1rem;
    }
    
    .CAInputContainer {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.1rem;
    }
    `;

    document.querySelector("head").appendChild(styles);
})();

const CA = new CookieAnalyzer();