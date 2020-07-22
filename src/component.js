export default (text = "FUck you Webpack") => {
    const element = document.createElement("p");

    element.innerHTML = text;
    console.log("gangsta");

    return element;
};