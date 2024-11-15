self.addEventListener("install", (event) =>{
    var CACHE_NAME = "media-it-cache-v1";
    var urls_to_cache = [
        "/",
        "/index.css",
        "/functions.js"
    ];

    event.waituntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urls_to_cache);
        })
    )
});