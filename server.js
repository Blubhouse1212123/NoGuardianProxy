const express = require("express");
const cors = require("cors");
const app = express();
const cheerio = require("cheerio");
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Proxy Online!");
});
function rewriteHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    $("base").remove();
    $("head").prepend(
        `<base href="#{baseUrl}">`
    );
    return $.html();
}
app.post("/browse", async (req, res) => {
    try {
        const url = req.body.url;
        if (!url) {
            return res.status(400).send("Missing Url");
        }
        const response = await fetch(url);
        const html = await response.text();
        const rewritten = rewriteHtml(
            html,
            url
        );
        res.send(rewritten);
    } catch(error) {
        console.error(error);
        res.status(500).send(
            "Failed to fetch website"
        );
    }
});
app.listen(process.env.PORT || 3000, () => {
    console.log("Server Started!");
});