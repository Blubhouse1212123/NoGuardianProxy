const express = require("express");
const cors = require("cors");
const app = express();
const cheerio = require("cheerio");
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Proxy Online!");
});
function proxify(url) {
    return `/browse?url=${encodeURIComponent(url)}`;
}
function rewriteHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    $("img").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;
        const absoloute = new URL(src, baseUrl).href;
        $(el).attr(
            "src",
            proxify(absoloute)
        );
    });
    $("script").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;
        const absoloute = new URL(src, baseUrl).href;
        $(el).attr(
            "src",
            proxify(absoloute)
        );
    });   
    $("link").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const absoloute = new URL(href, baseUrl).href;
        $(el).attr(
            "href",
            proxify(absoloute)
        );
    });
    $("a").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const absoloute = new URL(href, baseUrl).href;
        $(el).attr(
            "href",
            proxify(absoloute)
        );
    });
    //$("head").prepend(
      //  `<base href="${baseUrl}">`
    //);
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
    const originalAssign = location.assign;
    location.assign = function(url) {
        window.paent.postMessage(
            {
                type:"navigate",
                url: url
            },
            "*"
        );
    };
    const originalReplace = location.replace;
    location.replace = function(url) {
        window.paent.postMessage(
            {
                type:"navigate",
                url: url
            },
            "*"
        );        
    };
    history.pushState = new Proxy(
        history.pushState,
        {
            apply(target, thisArg,args){
                window.parent.postmessage(
                    {
                        type:"navigate",
                        url:args[2]
                    },
                    "*"
                );
                return target.apply(
                    thisArg,
                    args
                );
            }
        }
    );
    </script>
    `;
    $("head").prepend(script);
    return $.html();
}
app.get("/browse", async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).send("Missing Url");
        }
        const response = await fetch(url);
        res.removeHeader(
            "X-Frame-Options"
        );
        res.removeHeader(
            "Content-Security-Policy"
        );
        const type = 
        response.headers.get("content-type") || "";
        if(type.includes("text/html")) {
            const html = await response.text();
            const rewritten =
            rewriteHtml(html, url);
            res.setHeader(
                "Content-Type",
                "text/html"
            );
            return res.send(rewritten);
        }
        const buffer = 
        await response.arrayBuffer();
        res.setHeader(
            "Content-Type",
            type
        );
        res.send(
            Buffer.from(buffer)
        );
        //res.send(rewritten);
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