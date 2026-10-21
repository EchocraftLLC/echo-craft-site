// New session types, hands & expressions, and the golden hour city list.

FLOWS.push(
  { id: "senior", type: "senior", name: "Senior & grad session", length: "60 to 75 min", stages: [
    ["Warm up", ["Easy lean", "Slow walk", "Hands in pockets", "Wall lean"]],
    ["Portraits", ["Classic headshot", "Real laugh", "Window light portrait", "Look away", "Hand through hair"]],
    ["Your story", ["Letterman jacket", "Sport moment", "Instrument", "Car lean", "College shirt", "Best friend shot"]],
    ["Sit & relax", ["Steps sit", "Bench lean back", "Field sit"]],
    ["Golden hour", ["Over the shoulder", "Walk away, look back"]],
    ["Grad finale", ["Cap and gown", "Tassel turn", "Number moment", "Cap toss", "Celebration walk"]]
  ]},
  { id: "men", type: "men", name: "Men's portrait session", length: "45 to 60 min", stages: [
    ["Warm up", ["The relaxed stand", "Hand in pocket", "Walking toward me", "Wall lean"]],
    ["Headshots", ["Chin forward", "The squinch", "Laugh and look down", "Look into the distance", "Hand to beard or chin"]],
    ["Hands busy", ["Sleeve roll", "Watch check", "Adjust the collar", "Coffee in hand", "Jacket on shoulder", "Hobby moment"]],
    ["Seated", ["Seated, elbows on knees", "Ankle on knee", "Steps sit"]],
    ["Editorial", ["Over the shoulder", "Moody light", "Railing lean", "Walk past", "Hands clasped low"]],
    ["Finale", ["Arms crossed, relaxed", "Power stance"]]
  ]},
  { id: "newborn", type: "newborn", name: "Newborn at home", length: "2 to 3 hours", stages: [
    ["While baby is awake", ["Parent cradle", "Both parents above", "Family on the bed", "Siblings meet baby", "Rocking chair"]],
    ["Sleepy baby", ["Swaddled on the blanket", "Side-lying curl", "Basket nest", "Name or date sign"]],
    ["Tiny details", ["Tiny feet in hands", "Hand on hand", "Parents' rings"]],
    ["Parent moments", ["Skin to skin", "Forehead kiss", "Bath or feeding"]]
  ]},
  { id: "milestone", type: "newborn", name: "Milestone & cake smash", length: "45 min", stages: [
    ["Settle in", ["Favorite toy", "Tummy time", "Sitting up"]],
    ["Play", ["Bubbles", "Peekaboo with parent", "Lift up high", "First steps"]],
    ["The big moments", ["Month by month", "Cake smash", "Bath time"]]
  ]},
  { id: "pets", type: "pets", name: "Pet session", length: "45 to 60 min", stages: [
    ["Settle in", ["Down at their level", "Sit and look", "Window seat", "With their favorite toy"]],
    ["Portraits", ["Head tilt", "Close-up eyes", "Look away profile", "Tongue out"]],
    ["Tricks", ["Paw shake", "Treat on the nose", "Bandana or bow"]],
    ["With you", ["Owner hug", "Kiss on the head", "Paw in hand", "Lap dog", "On the couch", "Family and pet", "Two pets together"]],
    ["Action", ["Walk together", "Running to me", "Fetch in action", "Jump for the toy"]],
    ["Wind down", ["Belly up", "Lying together", "Nap time"]]
  ]}
);

WEAR.push(
  { type: "senior", palette: [["Denim", "#5d7898"], ["Cream", "#efe6d6"], ["School color", "#8c2f39"], ["Olive", "#6f7650"], ["Camel", "#b88b5a"]], fabrics: "Denim, knits, cotton, a dressy piece in satin or wool.", pairs: ["Casual: favorite jeans and a cream sweater.", "Dressy: one outfit you'd wear to a nice dinner.", "School pride: letterman jacket, team jersey or school colors.", "Grad: cap and gown over something you love."], avoid: "Huge logos, outfits you've never worn before, brand-new shoes that hurt.", mood: "Confident, fresh, you" },
  { type: "men", palette: [["Navy", "#26324a"], ["Charcoal", "#3d4045"], ["Olive", "#6a6f4c"], ["Tan", "#c4a27a"], ["White", "#f7f7f5"]], fabrics: "Wool, cotton oxford, denim, leather, chunky knits.", pairs: ["Navy blazer over a white shirt, no tie.", "Olive field jacket with a charcoal tee.", "Tan sweater with dark jeans and boots.", "Bring one outfit that shows your work or hobby."], avoid: "Wrinkled shirts, thin stripes, shirts that pull at the buttons.", mood: "Sharp, grounded, real" },
  { type: "newborn", palette: [["Cream", "#efe6d6"], ["Oat", "#d8c9b0"], ["Sage", "#a7b49b"], ["Dusty blue", "#9aaabb"], ["Blush", "#e7c6bd"]], fabrics: "Soft knits, muslin, cotton. Parents in comfy solids.", pairs: ["Baby: a simple knit swaddle or wrap in cream or oat.", "Parents: soft neutrals, like cream and sage.", "Siblings: one soft color from the palette.", "Bare feet for everyone at home."], avoid: "Scratchy fabrics, tags near baby's face, busy prints.", mood: "Soft, calm, tender" },
  { type: "pets", palette: [["Forest", "#3f5a43"], ["Rust", "#a85a3a"], ["Cream", "#efe6d6"], ["Denim", "#5d7898"], ["Mustard", "#d4a43a"]], fabrics: "Denim and cotton that fur won't cling to. Nothing delicate.", pairs: ["Pick colors that contrast with your pet's fur.", "Dark pet? Wear cream or mustard. Light pet? Wear forest or denim.", "One fun accessory for your pet, like a bandana."], avoid: "Black clothes with a light-haired pet. Bring a lint roller anyway.", mood: "Happy, outdoorsy, playful" }
);

// Hands: what to do with them. Row: [name, cue, why].
const HANDS = [
  ["Soft hands", "Shake them out, then let your fingers rest like you're holding a feather.", "Relaxed hands look elegant. Tense hands look like claws."],
  ["Show the edge", "Turn your hand so I see the side of it, pinky toward me.", "The edge of the hand is slimmer and more graceful than the back or palm."],
  ["Give them a job", "Hold your jacket, a coffee, a bouquet or your partner's hand.", "Hands with a job look natural. Empty hands look lost."],
  ["Bend every joint a little", "Soft wrist, soft fingers. No straight lines.", "Bent joints add flow. Straight arms and fingers look stiff."],
  ["Touch like it's precious", "Barely touch your face, hair or partner, like a whisper.", "A light touch looks gentle. Pressing squashes skin."],
  ["Hand to face, not on it", "Rest your fingertips near your jaw or collarbone, not your cheek.", "Framing the face is lovely. Leaning on it pushes the skin around."],
  ["Thumbs in pockets", "Slip just your thumbs into your pockets, fingers out.", "Relaxed and confident. Whole hands in pockets can look shy."],
  ["Hands on the waist", "Rest your hand at your natural waist and point your elbow back.", "Defines the waist and makes a nice triangle of space."],
  ["Hold hands loosely", "Link fingers, don't grip.", "Tight grips turn knuckles white and look tense."],
  ["Hands low and together", "Clasp your hands loosely in front, at your belt.", "Simple and polished for headshots and corporate."],
  ["Parent's hands for kids", "Keep a hand on your child's back or tummy, relaxed.", "Shows connection and keeps little ones safe and steady."],
  ["Hide nothing", "Keep your hands away from the front of your face and body.", "Hands in front of the face block expression and the body."]
];

// Expressions: how to get each look. Row: [look, cue, why].
const EXPRESSIONS = [
  ["A real smile", "Look down, think of something funny, then bring your eyes up to me.", "The eyes join in when the laugh is real."],
  ["The squinch", "Tighten your lower eyelids just a little, like you know a secret.", "Confident eyes instead of a deer-in-headlights stare."],
  ["Soft smile", "Smile with your mouth closed, then think 'I love this'.", "Calm and warm for serious portraits."],
  ["Laugh out loud", "Fake a big laugh, on three. It always turns real.", "Silly fake laughs make real ones."],
  ["Dreamy", "Close your eyes, take a slow breath, then open them halfway.", "Soft eyes for romantic and maternity shots."],
  ["Confident", "Chin forward and a little down. Think 'I've got this'.", "Strong jaw and steady eyes."],
  ["Mysterious", "Look past me and think about tomorrow.", "Editorial and thoughtful."],
  ["Loving look", "Look at your partner or baby and think of your favorite thing about them.", "Feelings show on the face. Give them a feeling."],
  ["Surprised and happy", "Pretend you just got the best news of your life.", "Big, bright expressions for kids and fun shots."],
  ["Relaxed mouth", "Blow air through your lips like a horse, then rest.", "Resets a stiff smile in two seconds."],
  ["Eyes on me", "Look right into the lens, like it's your best friend.", "Strong connection with whoever sees the photo."],
  ["Kids' real giggle", "Ask them if they smell like a stinky sock.", "Kids laugh at silly, not at 'say cheese'."]
];

// Golden hour cities: [name, lat, lon, time zone].
const CITIES = [
  ["Easton, PA", 40.69, -75.22, "America/New_York"], ["Allentown, PA", 40.60, -75.47, "America/New_York"],
  ["Bethlehem, PA", 40.63, -75.37, "America/New_York"], ["Philadelphia, PA", 39.95, -75.17, "America/New_York"],
  ["Pittsburgh, PA", 40.44, -79.99, "America/New_York"], ["Harrisburg, PA", 40.27, -76.88, "America/New_York"],
  ["Scranton, PA", 41.41, -75.66, "America/New_York"], ["Wilmington, DE", 39.74, -75.55, "America/New_York"],
  ["New York, NY", 40.71, -74.01, "America/New_York"], ["Boston, MA", 42.36, -71.06, "America/New_York"],
  ["Washington, DC", 38.91, -77.04, "America/New_York"],
  ["Atlanta, GA", 33.75, -84.39, "America/New_York"], ["Charlotte, NC", 35.23, -80.84, "America/New_York"],
  ["Miami, FL", 25.76, -80.19, "America/New_York"], ["Orlando, FL", 28.54, -81.38, "America/New_York"],
  ["Tampa, FL", 27.95, -82.46, "America/New_York"], ["Detroit, MI", 42.33, -83.05, "America/Detroit"],
  ["Chicago, IL", 41.88, -87.63, "America/Chicago"], ["Nashville, TN", 36.16, -86.78, "America/Chicago"],
  ["New Orleans, LA", 29.95, -90.07, "America/Chicago"], ["Houston, TX", 29.76, -95.37, "America/Chicago"],
  ["Dallas, TX", 32.78, -96.80, "America/Chicago"], ["Austin, TX", 30.27, -97.74, "America/Chicago"],
  ["San Antonio, TX", 29.42, -98.49, "America/Chicago"], ["Minneapolis, MN", 44.98, -93.27, "America/Chicago"],
  ["Kansas City, MO", 39.10, -94.58, "America/Chicago"], ["Denver, CO", 39.74, -104.99, "America/Denver"],
  ["Salt Lake City, UT", 40.76, -111.89, "America/Denver"], ["Phoenix, AZ", 33.45, -112.07, "America/Phoenix"],
  ["Las Vegas, NV", 36.17, -115.14, "America/Los_Angeles"], ["Los Angeles, CA", 34.05, -118.24, "America/Los_Angeles"],
  ["San Diego, CA", 32.72, -117.16, "America/Los_Angeles"], ["San Francisco, CA", 37.77, -122.42, "America/Los_Angeles"],
  ["Sacramento, CA", 38.58, -121.49, "America/Los_Angeles"], ["Portland, OR", 45.52, -122.68, "America/Los_Angeles"],
  ["Seattle, WA", 47.61, -122.33, "America/Los_Angeles"], ["Anchorage, AK", 61.22, -149.90, "America/Anchorage"],
  ["Honolulu, HI", 21.31, -157.86, "Pacific/Honolulu"], ["San Juan, PR", 18.47, -66.11, "America/Puerto_Rico"],
  ["Toronto, Canada", 43.65, -79.38, "America/Toronto"], ["Vancouver, Canada", 49.28, -123.12, "America/Vancouver"],
  ["Mexico City, Mexico", 19.43, -99.13, "America/Mexico_City"], ["London, UK", 51.51, -0.13, "Europe/London"],
  ["Paris, France", 48.86, 2.35, "Europe/Paris"], ["Rome, Italy", 41.90, 12.50, "Europe/Rome"],
  ["Manila, Philippines", 14.60, 120.98, "Asia/Manila"], ["Cebu, Philippines", 10.32, 123.89, "Asia/Manila"],
  ["Tokyo, Japan", 35.68, 139.69, "Asia/Tokyo"], ["Sydney, Australia", -33.87, 151.21, "Australia/Sydney"]
];

// Camera gear guide. Each section: name, intro, rows of [item, what it's for, tip].
const GEAR = [
  { name: "Lenses", intro: "Your lens shapes faces as much as your posing. Longer lenses flatter; wide lenses tell the story.", rows: [
    ["35mm prime", "Storytelling, groups in tight spaces, getting-ready and lifestyle shots.", "Keep faces away from the frame edges, where wide lenses stretch them."],
    ["50mm prime (f/1.8)", "The all-rounder: half-body portraits, couples, families. Cheap, light and sharp.", "Step back for headshots. Too close makes noses look bigger."],
    ["85mm prime", "The classic portrait lens. Flattering faces and creamy backgrounds.", "The go-to for plus-size, mature clients and headshots."],
    ["24-70mm f/2.8 zoom", "Weddings and events where you can't swap lenses.", "Use 50-70mm for faces and the wide end for scenes."],
    ["70-200mm f/2.8 zoom", "Ceremonies, candids from far away and the most flattering compression.", "Great for shy clients. They forget you're there."],
    ["100mm macro", "Rings, newborn toes, lashes and small details.", "Stop down to f/4 or more. Focus is paper thin up close."]
  ]},
  { name: "Flash or no flash", intro: "Natural light first, flash when the light can't do the job.", rows: [
    ["No flash", "Golden hour, open shade, big windows and newborns.", "Best for soft, natural looks. Raise ISO before you reach for flash."],
    ["On-camera flash, bounced", "Dark receptions, indoor family shots and quick fill.", "Point the head at a white ceiling or wall behind you. Never straight at faces."],
    ["Off-camera flash", "Dramatic portraits, beating harsh midday sun and night shots.", "Put it 45 degrees to the side and a little above the eyes."],
    ["Fill flash outdoors", "Backlit golden hour shots where faces go dark.", "Set flash 1 to 2 stops under the ambient light so it doesn't look flashed."],
    ["Never flash", "Newborns' eyes up close, ceremonies that ban it and pets that startle.", "Use window light or a continuous light instead."]
  ]},
  { name: "Flash types & power", intro: "More power means you can use modifiers, shoot in sun and recycle faster.", rows: [
    ["Speedlight (about 60 Ws)", "Light and cheap. Bouncing indoors and simple off-camera setups.", "Lithium models recycle fast enough for receptions."],
    ["Pocket strobe (100-200 Ws)", "Off-camera portraits with a small softbox, and small groups outdoors.", "A great first step up from speedlights."],
    ["Monolight strobe (300-600 Ws)", "Overpowering the sun, big softboxes and large groups.", "Use high-speed sync (HSS) to shoot at f/2.8 in bright light."],
    ["Power settings", "Start at 1/16 power for fill indoors, 1/4 to 1/2 for outdoor key light.", "Lower power means faster recycle and more shots per battery."],
    ["Triggers", "A radio trigger fires off-camera flashes and changes power from the camera.", "Match the trigger to your flash brand's system."]
  ]},
  { name: "Continuous light", intro: "What you see is what you get. Ideal for beginners, video and nervous clients.", rows: [
    ["LED panel", "Headshots, newborns and filling in window light.", "Pick one with adjustable color (bi-color) to match daylight or lamps."],
    ["LED with softbox", "Studio portraits and soft, even light for plus-size and mature skin.", "Bigger and closer means softer light."],
    ["Small RGB tube or wand", "Creative color, rim light and city night shots.", "Use as an accent, not the main light."],
    ["Ring light", "Even beauty headshots with ring catchlights.", "Flat on its own. Add a side light for shape."],
    ["When to skip it", "Big outdoor groups or bright sun.", "Continuous lights are much weaker than flash. Use strobes instead."]
  ]},
  { name: "Reflectors & modifiers", intro: "The cheapest way to make light look expensive.", rows: [
    ["5-in-1 reflector (32-43 in)", "White, silver, gold, black and a diffuser in one.", "White for soft fill, silver for punch, gold for warmth, black to add shadow."],
    ["Bounce from below", "Fill shadows under eyes and chin in open shade.", "Hold it at chest height, angled up. Not from the ground."],
    ["Diffuser (scrim)", "Turns harsh midday sun into soft shade.", "Hold it between the sun and the client, just out of frame."],
    ["Softbox or octabox", "Soft, flattering light from flash or LED.", "Place it as close as the frame allows."],
    ["Umbrella", "Fast, cheap, wide soft light for groups.", "Shoot-through for softer light, reflective for more power."],
    ["Grid or snoot", "Tightly controlled light for moody portraits and men's sessions.", "Keeps light off the background."]
  ]},
  { name: "Starting settings", intro: "Starting points to dial in, then adjust to taste.", rows: [
    ["Portraits, one person", "f/1.8 to f/2.8, 1/250s, ISO 100 to 800.", "Focus on the nearest eye."],
    ["Couples and small families", "f/2.8 to f/4, 1/320s.", "Keep faces on the same plane so everyone is sharp."],
    ["Big groups", "f/5.6 to f/8, 1/250s.", "Check focus on the back row."],
    ["Kids and pets", "f/2.8, 1/500s or faster, continuous focus.", "Use burst mode. The best frame is often the third one."],
    ["Newborns", "f/2.8 to f/4, 1/200s, window light.", "Turn off the shutter sound and keep the room warm."]
  ]}
];
// Gear kit by session type: [type id, lenses, light, extra].
const KITS = [
  ["couple", "35mm + 85mm", "Natural light, reflector", "Golden hour, walk and talk"],
  ["wedding", "24-70mm + 70-200mm + 100mm macro", "2 speedlights, off-camera flash", "Spare batteries and cards"],
  ["maternity", "50mm + 85mm", "Window light or golden hour, reflector", "Gown clips, stool"],
  ["corporate", "85mm or 70-200mm", "Strobe or LED with softbox", "Backdrop, posing stool"],
  ["kids", "35mm + 50mm", "Natural light, open shade", "Bubbles, toys, fast shutter"],
  ["plus", "85mm", "Big soft light, reflector", "Step stool to shoot slightly above"],
  ["group", "24-70mm", "Open shade, umbrella or strobe", "Step ladder, f/5.6 or more"],
  ["senior", "35mm + 85mm", "Golden hour, off-camera flash", "Props, a second outfit spot"],
  ["men", "85mm", "Off-camera flash with grid, or window light", "Darker backgrounds for mood"],
  ["newborn", "50mm + 100mm macro", "Window light or LED, never direct flash", "Space heater, white noise"],
  ["pets", "70-200mm + 35mm", "Natural light, fast shutter", "Treats, squeaky toys, a helper"]
];
