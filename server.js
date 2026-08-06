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
    $("img").each((i, el) => {
        const src = $(el).attr("src");
        if (src) {
            $(el).attr(
                "src",
                new URL(src, baseUrl).href
            );
        }
    });
    $("script").each((i, el) => {
        const src = $(el).attr("src");
        if (src) {
            $(el).attr(
                "src",
                new URL(src, baseUrl).href
            );
        }
    });   
    $("link").each((i, el) => {
        const href = $(el).attr("href");
        if (href) {
            $(el).attr(
                "href",
                new URL(href, baseUrl).href
            );
        }
    });
    $("a").each((i, el) => {
        const href = $(el).attr("href");
        if (href) {
            $(el).attr(
                "href",
                new URL(href, baseUrl).href
            );
        }
    });
    $("head").prepend(
        `<base href="${baseUrl}">`
    );
    const script = `
    <script>
    window.open = function(url) {
    
        window.parent.postMessage(
            {
                type: "navigate",
                url: url
            },
            "*"
        );
    };
    </script>
    `;
    $("body").prepend(script);
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