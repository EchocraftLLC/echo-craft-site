// New session types, hands & expressions, and the golden hour city list.

FLOWS.push(
  { id: "senior", type: "senior", name: "Senior & grad session", length: "45 min", stages: [
    ["Warm up", ["Easy lean", "Slow walk"]],
    ["The basics", ["Classic headshot", "Real laugh", "Over the shoulder", "Steps sit", "Walk away, look back"]],
    ["Finish", ["Cap and gown", "Cap toss"]]
  ]},
  { id: "men", type: "men", name: "Men's portrait session", length: "30 to 45 min", stages: [
    ["Warm up", ["The relaxed stand", "Walking toward me"]],
    ["The basics", ["Chin forward", "The squinch", "Hand in pocket", "Wall lean", "Seated, elbows on knees"]],
    ["Finish", ["Arms crossed, relaxed"]]
  ]},
  { id: "newborn", type: "newborn", name: "Newborn at home", length: "1 to 2 hours", stages: [
    ["While baby is awake", ["Parent cradle", "Both parents above"]],
    ["The basics", ["Swaddled on the blanket", "Side-lying curl", "Tiny feet in hands", "Forehead kiss"]],
    ["Finish", ["Family on the bed"]]
  ]},
  { id: "milestone", type: "newborn", name: "Milestone & cake smash", length: "30 to 45 min", stages: [
    ["Settle in", ["Favorite toy", "Sitting up"]],
    ["The basics", ["Peekaboo with parent", "Bubbles", "Lift up high"]],
    ["Finish", ["Cake smash"]]
  ]},
  { id: "branding", type: "branding", name: "Business branding session", length: "60 min", stages: [
    ["Warm up", ["Walk into work", "Coffee break"]],
    ["The basics", ["Brand headshot", "Confident crossed arms", "At the desk", "Hands at work", "With your product"]],
    ["Finish", ["Outside the business"]]
  ]},
  { id: "pets", type: "pets", name: "Pet session", length: "30 to 45 min", stages: [
    ["Settle in", ["Down at their level", "Sit and look"]],
    ["The basics", ["Head tilt", "Owner hug", "Kiss on the head", "Walk together", "Running to me"]],
    ["Finish", ["Lying together"]]
  ]}
);

WEAR.push(
  { type: "senior", palette: [["Denim", "#5d7898"], ["Cream", "#efe6d6"], ["School color", "#8c2f39"], ["Olive", "#6f7650"], ["Camel", "#b88b5a"]], fabrics: "Denim, knits, cotton, a dressy piece in satin or wool.", pairs: ["Casual: favorite jeans and a cream sweater.", "Dressy: one outfit you'd wear to a nice dinner.", "School pride: letterman jacket, team jersey or school colors.", "Grad: cap and gown over something you love."], avoid: "Huge logos, outfits you've never worn before, brand-new shoes that hurt.", mood: "Confident, fresh, you" },
  { type: "men", palette: [["Navy", "#26324a"], ["Charcoal", "#3d4045"], ["Olive", "#6a6f4c"], ["Tan", "#c4a27a"], ["White", "#f7f7f5"]], fabrics: "Wool, cotton oxford, denim, leather, chunky knits.", pairs: ["Navy blazer over a white shirt, no tie.", "Olive field jacket with a charcoal tee.", "Tan sweater with dark jeans and boots.", "Bring one outfit that shows your work or hobby."], avoid: "Wrinkled shirts, thin stripes, shirts that pull at the buttons.", mood: "Sharp, grounded, real" },
  { type: "newborn", palette: [["Cream", "#efe6d6"], ["Oat", "#d8c9b0"], ["Sage", "#a7b49b"], ["Dusty blue", "#9aaabb"], ["Blush", "#e7c6bd"]], fabrics: "Soft knits, muslin, cotton. Parents in comfy solids.", pairs: ["Baby: a simple knit swaddle or wrap in cream or oat.", "Parents: soft neutrals, like cream and sage.", "Siblings: one soft color from the palette.", "Bare feet for everyone at home."], avoid: "Scratchy fabrics, tags near baby's face, busy prints.", mood: "Soft, calm, tender" },
  { type: "branding", palette: [["Brand color", "#2f5d62"], ["Navy", "#26324a"], ["Cream", "#efe6d6"], ["Camel", "#b88b5a"], ["White", "#f7f7f5"]], fabrics: "Clean cotton, knits, blazers, aprons or uniforms you really work in.", pairs: ["One polished look: a blazer or smart top in a solid color.", "One working look: what you wear on a real day, apron or uniform included.", "One relaxed look for lifestyle shots.", "Add your brand color in a top, accessory or prop."], avoid: "Logos from other brands, tiny patterns, outfits that clash with your logo colors.", mood: "Professional, real, on-brand" },
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
  ["branding", "35mm + 85mm + 100mm macro", "Window light plus an off-camera flash or LED", "Products, props, a step stool for flat lays"],
  ["pets", "70-200mm + 35mm", "Natural light, fast shutter", "Treats, squeaky toys, a helper"]
];

// Seasonal palettes for What to Wear. Each: palette, mood, fabrics, outfit ideas and a tip for the light and location.
const SEASONS = [
  { id: "spring", name: "Spring", palette: [["Blush", "#e9c2bb"], ["Sage", "#a9b89a"], ["Butter", "#f1dc9a"], ["Sky blue", "#a9c3db"], ["Ivory", "#f5efe3"]], mood: "Fresh, soft, blooming",
    fabrics: "Light cotton, linen blends, chiffon, a light knit or denim jacket for cool mornings.",
    ideas: ["Flowy dresses in blush or butter yellow against fresh green.", "Soft pastels with one white or ivory piece to brighten faces.", "Light denim with a sage or sky blue top.", "A trench or light cardigan for chilly evenings."],
    tip: "Blossoms and fresh grass are the backdrop. Pastels pop against them, while neon fights them." },
  { id: "summer", name: "Summer", palette: [["Coral", "#e98b74"], ["Turquoise", "#4fb3b0"], ["Sunflower", "#efc24a"], ["White", "#fbfaf7"], ["Navy", "#26324a"]], mood: "Bright, sunny, carefree",
    fabrics: "Breathable linen, cotton, gauze and swim cover-ups. Nothing heavy or shiny.",
    ideas: ["Crisp white with one bright pop like coral or turquoise.", "Navy and white for a classic beach look.", "Sunflower yellow for golden hour glow.", "Bare feet or sandals at the beach. Skip heavy shoes."],
    tip: "Shoot at golden hour. Bright colors and whites glow in warm light but blow out in midday sun." },
  { id: "fall", name: "Fall", palette: [["Rust", "#a85a3a"], ["Mustard", "#c9982e"], ["Olive", "#6f7650"], ["Burgundy", "#6e2a33"], ["Cream", "#efe6d6"]], mood: "Warm, cozy, rich",
    fabrics: "Chunky knits, corduroy, suede, flannel, boots and scarves.",
    ideas: ["Rust or mustard sweaters with dark denim.", "Burgundy and cream for a rich, classic look.", "Olive and camel layers with boots.", "Hats, scarves and a cozy blanket as props."],
    tip: "Orange leaves love warm tones. Avoid bright orange clothes, which blend into the trees." },
  { id: "winter", name: "Winter", palette: [["Emerald", "#2f6b52"], ["Deep red", "#9b2335"], ["Charcoal", "#3d4045"], ["Silver gray", "#b9bcc0"], ["Winter white", "#f4f2ee"]], mood: "Crisp, bold, elegant",
    fabrics: "Wool coats, cable knits, velvet, faux fur, leather gloves.",
    ideas: ["A bold coat in emerald or deep red against snow.", "Winter white and silver gray for a soft, snowy look.", "Charcoal with one jewel tone for holiday cards.", "Gloves, beanies and scarves in coordinating colors."],
    tip: "Snow is a giant reflector. Jewel tones pop against it, but all-white outfits disappear. Keep sessions short and warm." }
];

// Camera basics: short lessons on focal length and settings.
const FOCAL_LESSONS = [
  // [range, feels like, best for, faces & background, where to stand]
  ["14–24mm (ultra wide)", "Bigger than your eyes see. Lines bend and space feels huge.", "Venues, big landscapes with tiny people, dramatic real estate-style scenes.", "Stretches anything near the edges, faces included. The background looks far away and small.", "Keep people in the middle of the frame and at least 8 ft away."],
  ["35mm", "A natural, documentary look, a bit wider than your eyes.", "Getting ready, lifestyle, families at home, environmental portraits that show the place.", "Fine for half-body shots. Up close it widens noses and foreheads.", "6 to 10 ft for half body. Don't use it for tight headshots."],
  ["50mm", "Close to what your eyes see. Honest and simple.", "Couples, families, half-body portraits, everyday shooting.", "Flattering from waist up. A little background blur at f/1.8.", "About 5 to 8 ft for half body, 12 to 15 ft for full length."],
  ["85mm", "The classic portrait look. Calm, flattering and intimate.", "Headshots, close portraits, plus-size and mature clients, couples close-ups.", "Slims and flattens faces gently. Backgrounds melt into soft blur.", "About 6 ft for a headshot, 15 to 20 ft for full length."],
  ["105–135mm", "Compressed and polished. Backgrounds look closer and bigger.", "Tight headshots, beauty, candids from a distance, shy clients.", "Very flattering faces and creamy, simple backgrounds.", "8 to 10 ft for a headshot. You'll need room to back up."],
  ["200mm", "Strong compression. The background stacks right behind your subject.", "Ceremonies, candids, making a moon or skyline loom behind people.", "The most flattering for faces. Background becomes a wash of color.", "25 ft or more for full length. Use a fast shutter, 1/400 or quicker."]
];
const FOCAL_TIPS = [
  "Compression comes from where you stand, not the lens itself. A longer lens just lets you stand farther back, which flattens faces and pulls the background in.",
  "On an APS-C camera, multiply by 1.5 (1.6 on Canon) to get the full-frame look: a 56mm acts like an 85mm.",
  "Wide lenses tell the story of the place. Long lenses tell the story of the person.",
  "When in doubt for faces, go longer and step back."
];
const SETTINGS = [
  // [situation, aperture, shutter, ISO, focus, tip]
  ["Portrait in open shade", "f/2 – f/2.8", "1/250", "100 – 400", "Single point or eye AF", "Expose for the face. Shade is cool, so warm the white balance a little (shade preset)."],
  ["Golden hour, backlit", "f/1.8 – f/2.8", "1/320", "100 – 400", "Eye AF", "Shoot a little bright (+⅓ to +1) so faces aren't dark. A lens hood cuts haze unless you want flare."],
  ["Bright midday sun", "f/4 – f/5.6", "1/1000+", "100", "Eye AF", "Find shade or put the sun behind your client and add a reflector or fill flash."],
  ["Couple walking or twirling", "f/2.8 – f/4", "1/500", "Auto ISO", "Continuous (AF-C) with tracking", "Burst mode. Ask them to walk slowly; slow walks look better and stay sharp."],
  ["Kids running and playing", "f/2.8 – f/4", "1/800+", "Auto ISO", "Continuous with tracking", "Get down to their level and pre-focus where they'll run."],
  ["Small group (3 to 8)", "f/4 – f/5.6", "1/250", "100 – 800", "Single point on the front row", "Keep everyone on the same plane. Two rows? Go to f/5.6 or f/8."],
  ["Large group (15+)", "f/8", "1/250", "200 – 1600", "Single point, a third of the way in", "Stand on something to see every face. Take at least 5 frames for blinks."],
  ["Indoor window light", "f/1.8 – f/2.8", "1/160", "400 – 1600", "Eye AF", "Turn off room lights to avoid mixed colors. Turn your client toward the window."],
  ["Dim reception or event", "f/2 – f/2.8", "1/125 – 1/200", "1600 – 6400", "Continuous, eye AF", "Bounce flash off the ceiling or a wall behind you for soft, even light."],
  ["Rings and small details", "f/4 – f/8", "1/200", "200 – 800", "Single point, manual focus if needed", "Up close, depth of field is razor thin. Use a macro lens or step back and crop."],
  ["Newborn at home", "f/2.8 – f/4", "1/200", "400 – 1600", "Single point on the closest eye", "Use window light and a warm room. Never sacrifice safety for a pose."],
  ["Pets in action", "f/2.8 – f/4", "1/1000+", "Auto ISO", "Continuous with animal eye AF", "Squeak toys get the ear perk. Burst mode and lots of patience."],
  ["Sunset silhouette", "f/5.6 – f/8", "1/1000", "100", "Single point on the person's edge", "Expose for the bright sky so your client goes black. Clear profiles read best."],
  ["Blue hour with city lights", "f/2 – f/4", "1/60 – 1/125", "800 – 3200", "Eye AF", "Add a little flash on your client to balance with the glowing background."],
  ["Night sky and stars", "f/1.4 – f/2.8", "15 – 25 sec", "3200 – 6400", "Manual, focused on a bright star", "Tripod required. Shoot near the new moon, away from city lights."]
];
const BASICS = [
  ["Aperture (f-number)", "Controls background blur and how much is in focus. Smaller numbers (f/1.8) mean more blur and more light. Bigger numbers (f/8) keep more in focus.", "Portraits: f/1.8 to f/2.8. Groups: f/4 to f/8."],
  ["Shutter speed", "Controls motion. Faster freezes movement; slower lets in more light but shows blur.", "Handheld, use at least 1 over your focal length (1/100 for 85mm). People moving: 1/500 and up."],
  ["ISO", "Brightens the image in camera. Higher ISO adds grain, but modern cameras look clean to 3200 or more.", "Keep it as low as the light allows, but a sharp grainy photo beats a blurry clean one."],
  ["White balance", "Sets how warm or cool the colors look.", "Use daylight or shade presets outdoors so a set of photos matches. Shoot RAW to fix it later."],
  ["Focus modes", "Single (AF-S) locks focus for still subjects. Continuous (AF-C) tracks moving ones.", "Turn on eye AF for people and animal eye AF for pets."],
  ["Metering and exposure", "Your camera guesses brightness from the whole scene, which fools it with bright skies or white dresses.", "Use exposure compensation: brighter (+) for backlight and snow, darker (−) for dark scenes."]
];
