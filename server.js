const express = require("express");
const cors = require("cors");
const app = express();
const cheerio = require("cheerio");
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Proxy Online!");
});
const PROXY = "https://noguardianproxy.onrender.com/proxy?url=";
function proxify(url, baseUrl) {
    return PROXY + encodeURIComponent(url) + "&base=" + encodeURIComponent(baseUrl);
}
function rewriteHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    $("img").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;
        const absoloute = new URL(src, baseUrl).href;
        $(el).attr(
            "src",
            proxify(absoloute, baseUrl)
        );
    });
    $("img").each((_, el) => {
        const srcset = $(el).attr("srcset");
        if (!srcset) return;
        const fixed = 
        srcset.split(",")
        .map(item => {
            let parts = item.trim().split(" ");
            parts[0] = 
            proxify(
                new URL(
                    parts[0],
                    baseUrl
                ).href,
                baseUrl
            );
            return parts.join(" ");
        })
        .join(",");
        $(el).attr(
            "srcset",
            fixed
        );
    });
    $("script").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;
        const absoloute = new URL(src, baseUrl).href;
        $(el).attr(
            "src",
            proxify(absoloute, baseUrl)
        );
    });   
    $("link").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const absoloute = new URL(href, baseUrl).href;
        $(el).attr(
            "href",
            proxify(absoloute, baseUrl)
        );
    });
    $("a").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const absoloute = new URL(href, baseUrl).href;
        $(el).attr(
            "href",
            proxify(absoloute, baseUrl)
        );
    });
    $("form").each((_, el) => {
        const action = $(el).attr("action");
        if (!action) return;
        const absoloute = new URL(action, baseUrl).href;
        $(el).attr(
            "action",
            proxify(absoloute, baseUrl)
        );
    }); 
    $("iframe").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;
        const absoloute = new URL(src, baseUrl).href;
        $(el).attr(
            "src",
            proxify(absoloute, baseUrl)
        );
    }); 
    $("video").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;
        const absoloute = new URL(src, baseUrl).href;
        $(el).attr(
            "src",
            proxify(absoloute, baseUrl)
        );
    }); 
    $("source").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;
        const absoloute = new URL(src, baseUrl).href;
        $(el).attr(
            "src",
            proxify(absoloute, baseUrl)
        );
    });
    $("head").prepend(
        `<base href="${PROXY}${encodeURIComponent(baseUrl)}">`
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
    const originalAssign = location.assign;
    location.assign = function(url) {
        window.parent.postMessage(
            {
                type:"navigate",
                url: url
            },
            "*"
        );
    };
    const originalReplace = location.replace;
    location.replace = function(url) {
        window.parent.postMessage(
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
                window.parent.postMessage(
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
    window.fetch = new Proxy(window.fetch,{
        apply(target,thisArg,args){
            if(typeof args[0] === "string"){
                const absoloute = 
                new URL(
                    args[0],
                    document.baseURI
                ).href
                args[0] = "${PROXY}" + encodeURIComponent(absoloute) + "&base=" + encodeURIComponent(document.baseURI);
            }
            return target.apply(
                thisArg,
                args
            );
        }
    });
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(
        method,
        url,
        ...rest
    ){
        
        const absoloute = 
        new URL(
            url,
            document.baseURI
        ).href
        return originalOpen.call(
            this,
            method,
            "${PROXY}" + encodeURIComponent(absoloute) + "&base=" + encodeURIComponent(document.baseURI),
            ...rest
        );
    };
    document.addEventListener("click", (e) => {
        const a = e.target.closest("a");
        if (a) {
            console.log(a.href);
        }
    }, true);
    </script>
    `;
    $("meta[http-equiv='refresh']").each((_, el)=> {
        const content = $(el).attr("content");
        if (!content) return;
        const match = content.match(/url=(.*)/i);
        if (!match) return;
        const absoloute = 
        new URL(
            match[1],
            baseUrl
        ).href;
        $(el).attr(
            "content",
            "0;url=" + proxify(absoloute, baseUrl)
        );
    });
    $("head").prepend(script);
    return $.html();
}
app.get("/proxy", async (req, res) => {
    try {
        const url = req.query.url;
        const base = req.query.base || url;
        if (!url) {
            return res.status(400).send("Missing Url");
        }
        const response = await fetch(url, {
            headers: {
                "User-Agent":
                "Mozilla/5.0 Chrome/120 Safari/537.36"
            }
        });
        response.headers.forEach((value, key)=>{
            const blocked = [
                "content-encoding",
                "content-length",
                "transfer-encoding",
                "content-disposition",
                "x-frame-options",
                "content-security-policy"
            ];
            if (!blocked.includes(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        });
        const type = 
        response.headers.get("content-type") || "";
        if(type.includes("text/html")) {
            let html = await response.text();
            html = rewriteHtml(html, base);
            res.setHeader(
                "Content-Type",
                "text/html; charset=utf-8"
            );
            return res.send(html);
        }
        const buffer = await response.arrayBuffer();
        res.setHeader(
            "Content-Type",
            type
        );
        return res.send(
            Buffer.from(buffer)
        );
    } catch(error) {
        console.error(error);
        res.status(500).send(
            "Proxy failed"
        );
    }
});
app.use((req, res) => {
    res.status(404).send(
        "Proxy route missing"
    );
});
app.listen(process.env.PORT || 3000, () => {
    console.log("Server Started!");
});