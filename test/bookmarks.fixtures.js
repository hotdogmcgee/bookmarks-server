function makeBookmarksArray() {
    return [
        {
            "id": 1,
            "title": "book one",
            "url": "www.hello.com",
            "rating": "1",
            "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non. Adipisci, pariatur. Molestiae, libero esse hic adipisci autem neque?"
        },
        {
            "id": 2,
            "title": "the diary",
            "url": "www.face.com",
            "rating": "4",
            "description": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Cum, exercitationem cupiditate dignissimos est perspiciatis, nobis commodi alias saepe atque facilis labore sequi deleniti. Sint, adipisci facere! Velit temporibus debitis rerum."
        },
        {
            "id": 3,
            "title": "lamp post",
            "url": "www.yoyoy.com",
            "rating": "5",
            "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Possimus, voluptate? Necessitatibus, reiciendis? Cupiditate totam laborum esse animi ratione ipsa dignissimos laboriosam eos similique cumque. Est nostrum esse porro id quaerat."
        },
    ]
}

function makeMaliciousBookmark() {
    const maliciousBookmark = {
     id: 911,
     title: 'Naughty naughty very naughty <script>alert("xss");</script>',
     description: 'How-to',
     url: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
     rating: 4
   }

   const expectedBookmark = {
     ...maliciousBookmark,
     title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
     url: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
   }

   return { expectedBookmark, maliciousBookmark }

 }
 
 module.exports = {
   makeBookmarksArray, makeMaliciousBookmark
 }