/*

 // TODO:  Generalize both functions and make them available as both client and server modules

 templates.mdHelper = function(options) {
 if (Markdown && Markdown.getSanitizingConverter) {
 var converter = Markdown.getSanitizingConverter();
 // Double all single carriage returns so that they result in new paragraphs, at least for now
 converter.hooks.chain("preConversion", function (text) { return text.replace(/[\r\n]+/g, "\n\n"); });
 return converter.makeHtml(options.fn(this));
 }
 else {
 console.log("Pagedown or one of its dependencies is not available, so markdown will be passed on without any changes.");
 }

 // If we can't evolve the output, we just pass it through.
 return options.fn(this);
 };

 Handlebars.registerHelper('md', templates.mdHelper);

 templates.jsonify = function(context) { return JSON.stringify(context); };

 */