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

        if(this.autobuy) this.mostEfficientBuilding.buy();
        
        if(this.autoclick) {
            if(!this.autoclickInterval) {
                this.setAutoclick();
            }
        } else if(this.autoclickInterval) {
            this.removeAutoClick();            
        }

        this.highlightBuilding(this.mostEfficientBuilding.name);
        this.setMostEfficientText();
        this.setEfficiencyText(mostEfficientBuilding);
    }
    
    SetupUI(){
        if(this.refreshInterval) clearInterval(this.refreshInterval);
        const adSpace = document.querySelector(CONSTANTS.adElementSelector);
        adSpace.innerHTML = "";

        const CAContainer = document.createElement("section");
        CAContainer.classList.add(CONSTANTS.containerId);
        CAContainer.classList.add("title");
        CAContainer.setAttribute("id", CONSTANTS.containerId);

        this.DOM.container = CAContainer;
        CAContainer.innerHTML = `<h2 class="CA-Title">Cookie Analyzer</h2>`;

        const dataContainer = document.createElement("div");
        dataContainer.classList.add(CONSTANTS.dataContainerId);
        this.DOM.dataContainer = dataContainer;

        const mostEfficient = document.createElement("p")
        mostEfficient.classList.add(CONSTANTS.mostEfficientId, "subButton");
        this.DOM.mostEfficient = mostEfficient;
        this.setMostEfficientText(this.mostEfficientBuilding);
        mostEfficient.addEventListener("click", this.buyMostEfficient.bind(this));

        const efficiency = document.createElement("small");
        efficiency.classList.add(CONSTANTS.efficiencyId);
        this.DOM.efficiency = efficiency;
        this.setEfficiencyText(this.getMostEfficientBuilding());

        const autoBuyContainer = this.createCheckbox("autobuy", "Autobuy?");
        const autoClickContainer = this.createCheckbox("autoclick", "Autoclick?");

        dataContainer.appendChild(mostEfficient);
        dataContainer.appendChild(efficiency);
        dataContainer.appendChild(autoBuyContainer);
        dataContainer.appendChild(autoClickContainer);
        
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

    createCheckbox(name, label){
        const $container = document.createElement("div");
        $container.classList.add("CACheckboxContainer");
        
        const $label = document.createElement("label");
        $label.textContent = label;
        $label.setAttribute("for", name)
        
        const $checkbox = document.createElement("input")
        $checkbox.type ="checkbox";
        $checkbox.name = name;
        this.DOM[name] = $checkbox;
        this[name] = $checkbox.checked;
        $checkbox.classList.add("subButton");
        $checkbox.addEventListener("change", (e) => this[name] = e.target.checked);

        $container.appendChild($label);
        $container.appendChild($checkbox);

        return $container;
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