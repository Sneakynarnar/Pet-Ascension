
# Pet Ascension #

Hello, welcome to sneakynarnar's Pet ascension

This coursework achieved a 90% grade at the University of Portsmouth "Application Programming" module

Granted, as mentioned below. It's far from perfect, there are a lot of bugs / things I could have done better. 
## How to play ##

Start the script by running `npm run setup` and then `npm start`
## Coursework thingies ##

### Easy requirements satisfied ###
- Pet displayed in app and there are 3 stats, Hunger, Fitness and Cleanliness.
- User interacts to increase the value of these attributes.
- Happiness is a stat that is an average of every stat.
- Pet can die from illness, starvation and sacrifice

### Additional features ###
- Users can have multiple pets
- Users can pick the colours of each pet. And this is displayed everywhere
- Users can earn a currency called NP from having pets. This can be used to buy items or to ascend pets.
- Users can sacrifice their pets for pet blood, this blood can be used to ascend other pets which allows them to level up faster and earn more NP.
- Users can increase the pets stats by feeding them with items they brought from the shop.
- Users have a choice of two games they can play with their pets, the better they do in the game the more the pets happiness increases
- There is a leaderboard that displays the top pets.
- Discord OAuth2 for logging in to the site
- You can speed up NP gain or XP gain, (or any gain really) Since they are all in constants



## Ways to test ##
The following is refering to the file `sqlpetinteractions.mjs`
- To get more NP, try increasing the `BASE_NP_RATE` variable
- To gain XP faster increase `BASE_LEVEL_BOOST`
- To make your pet lose attributes faster alter the `DECAY` variables

## If I had more time... ## 
I drastically overestimated how much I needed to work on this project, there are alot more features I wanted to add or tweak / There are alot of things I would have done differently if I were to do this project again.
### Proposed features ###
- Pet trading and random attributes that make pets better / worse at things to make it worthwhile to trade
- Different ascension system that rewards players more for ascending
- More minigames to increase happiness, one that is more skill than luck.
- Tutorials / tooltips, since right now its pretty much impossible to realise you are supposed to drag items to the pet in order to feed them
- Better manouvrebility around the site, during development I would use the forward and back browser buttons, so it slipped my mind to add links back the the pet page etc

### Known bugs that I didn't have time to fix ###

- On the higher or lower, the game completely breaks if the viewport width gets too small
- Feeding and Cleaning behave weirdly when the user has no items, including the counter going to -1 when the donut is dragged
- A lot of pages break if the viewport width is too small, and would be unsuitable for mobile devices.
- I forgot to put some sort of message when a pet is too tired to play or eat, because I always had that feature off and forgot that I needed to put some sort of recognition why the request was being denied. Realised this 20 mins ago when I turned back up the constants (it is 10 40pm as of writing this);

### Coding habits ###

- I was going to comment all of my code but I ran out of time
- Overusing IDs instead of classes in HTML, this stems from my unfamiliarity with HTML and how it traditionally merges with javascript
- Code that could be more efficient, but I was too lazy to make it faster because it worked and I decided it was good enough
- Further modularisation might have been easier
- Messy HTML, especially with alot of repeated code that I could have done something about. With the svgs I wanted to find a way to write SVGs directly into the DOM but I couldnt find anything until I was near the end of my project. So before I just physically added them and hid the svgs I wasnt using



### Server routes ###
## GET ##
```
/
/leaderboard
/pets
/pets/create
/pets/<petname>
/pets/:accountId/:petName
/shop/:accountId/items
/shop/:accountId/
/api/leaderboard
/api/:accountId/items
/api/:accountId/:petName

```
## POST ##

```
/shop/:accountId/:item
/api/:accountId/:petName/play
/api/:accountId/:petName/care
/pets/:accountId/:petName/sacrifice
/pets/:accountId/:petName/guild
/pets/create
```
Enjoy :)
