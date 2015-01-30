var fluid = fluid || require('infusion');

// "marker" grade for components that act as an express router
fluid.defaults("gpii.express.router", {
    gradeNames: ["fluid.eventedComponent", "autoInit"]
});