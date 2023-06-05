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
    UIRefreshInterval: 500, // m
    efficiencyFloatPrecision: 6,
}

class CookieAnalyzer {
    constructor() {
        this.mostEfficientBuilding = this.getMostEfficientBuilding().building;
        this.autobuy = this.DOM?.autobuy?.checked;
        this.autoclick = this.DOM?.autoclick?.checked;
        this.autoclickgolden = this.DOM?.autoclickgolden?.checked;

        this.DOM = {
            container: undefined,
            dataContainer: undefined,
            mostEfficient: undefined,
            efficiency: undefined,
            autobuy: undefined,
        }

        this.SetupUI();
        this.refreshInterval = setInterval(this.refreshUI.bind(this), CONSTANTS.UIRefreshInterval);
        this.autoclickInterval = undefined;
    }

    // ===== DOM MANIPULATION ======
    //   === UI ===
    refreshUI(){
        // Get most efficient building
        const mostEfficientBuilding = this.getMostEfficientBuilding();
        this.mostEfficientBuilding = mostEfficientBuilding.building;

        const canBuyBuilding = this.mostEfficientBuilding.getPrice() <= Game.cookies;
        // It should probably be a button and disable it but is easier to use class toggles
        this.DOM.mostEfficient.classList.toggle("noMoney", !canBuyBuilding);

        if(this.autobuy) this.mostEfficientBuilding.buy();
        if(this.autoclickgolden) this.autoClickGoldenCoookies();
        this.updateAutoclick();

        this.highlightBuilding(this.mostEfficientBuilding.name);
        this.setMostEfficientText();
        this.setEfficiencyText(mostEfficientBuilding);
    }
    
    SetupUI(){
        // Replace tooltip function
        this.setupTooltipExtension();

        // Clear previous refresh interval (probably doesn't work)
        if(this.refreshInterval) clearInterval(this.refreshInterval);

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


        dataContainer.appendChild(mostEfficient);
        dataContainer.appendChild(efficiency);
        dataContainer.appendChild(autoBuyContainer);
        dataContainer.appendChild(autoClickContainer);
        dataContainer.appendChild(autoClickGoldenContainer);
        
        CAContainer.appendChild(dataContainer);
        adSpace.appendChild(CAContainer);
    }

    setMostEfficientText(){
        const str = `Buy: ${this.mostEfficientBuilding.name}`;
        this.DOM.mostEfficient.textContent = str;
    }

    setEfficiencyText(building){
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
        $input[valueAccesor] = this[name];
        $input.classList.add("subButton");
        $input.addEventListener("change", (e) => this[name] = e.target[valueAccesor]);

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
        const newBlock = document.createElement("div");
        newBlock.classList.add("descriptionBlock");
        const boldText = document.createElement("b");
        boldText.textContent = efficiency.toFixed(CONSTANTS.efficiencyFloatPrecision);

        newBlock.appendChild(boldText);
        newBlock.innerHTML += " CPSPCS";

        const newBlockString = newBlock.outerHTML;

        // Insert newBlock before the last </div> in the tooltip string
        const index = tooltip.lastIndexOf("</div>");
        const ret = tooltip.substring(0, index) + newBlockString + tooltip.substring(index)

        return ret;
        
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
        return Game.ObjectsById.filter(e => !e.locked);
    }
    
    // CPSPCS: Cookies per second per cookie spent
    // (basically cost efficiency but CPSPCS is funnier)
    calculateCPSPCS(buildingId){
        const building = this.getBuildingByID(buildingId);
    
        const price = building.getPrice();
        const cps = building.cps(building);
    
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
        if(this.autoclick) {
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
    
    .CAEfficiency {
        display:block;
        color: #aaa;
        margin: 1rem;
    }
    
    .CACheckboxContainer {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    `;

    document.querySelector("head").appendChild(styles);
})();

const CA = new CookieAnalyzer();