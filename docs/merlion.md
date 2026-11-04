# The Merlion and the Merlion cub

Checklist **SG-147**. Program: `js/landmark-models/merlion.js`; tests: `tests/landmark-merlion.test.cjs`; overview: [`docs/images/merlion-overview.png`](images/merlion-overview.png). Built on 3 November 2026 with the landmark kit, replacing a placeholder stack of cylinders.

The Merlion is the lion-headed fish the Singapore Tourist Promotion Board adopted as its emblem in the 1960s. Lim Nang Seng made the statue between November 1971 and August 1972 (concrete on a steel frame), and Lee Kuan Yew unveiled it at the mouth of the Singapore River on 15 September 1972. In April 2002 it was carried by barge about 120 m to the tip of the new, larger Merlion Park in front of One Fullerton, where it stands on tiled waves on a round granite drum rising out of Marina Bay and spouts into the bay. The 2 m Merlion cub, white porcelain mosaic, stands 23 m behind it in its own small basin.

## References and interpretation

Read 3 November 2026 unless stated.

- [Wikipedia, *Merlion*](https://en.wikipedia.org/wiki/Merlion): 8.6 m, 70 tonnes, Lim Nang Seng, built November 1971 – August 1972, unveiled 15 September 1972; moved 23–25 April 2002 about 120 m to the new promontory, "facing East"; the two-pump system since the move; the cub about 2 m and 3 tonnes, standing behind the statue.
- [Roots.sg (National Heritage Board), *The Merlion*](https://www.roots.gov.sg/Collection-Landing/listing/1183408): 8.6 m, 70 tonnes, concrete wrapped round a steel frame, designed to spout water from its mouth, placed at the edge of the park near the river mouth facing east; the cub about 2 m.
- [Visit Singapore, *Merlion Park*](https://www.visitsingapore.com/see-do-singapore/recreation-leisure/viewpoints/merlion-park/): 8.6 m, 70 tonnes, spouting from its mouth, in front of the Fullerton Hotel overlooking Marina Bay. (NLB Infopedia's *Merlion* article renders only with script and could not be read.)
- OpenStreetMap, fetched from the API: way **182819157** (`amenity=fountain`, `tourism=artwork`, `name=Merlion Fountain`, version 21 of 4 June 2025), a 2.84 m circle round the statue's body; node **6283080658** (`name=The Merlion Cub`, 1.2867975, 103.8543012). The quay lines round the platform's tip match the aerial to about a metre.
- [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9), zoom 19 tiles (0.30 m per pixel) with the OSM ways overlaid. The tiled waves show as a dark D about 9.7 × 7 m on the drum at the quay; the jet is a pale streak from the head to a white splash.
- Wikimedia Commons, [Category:Merlion statues (Merlion Park)](https://commons.wikimedia.org/wiki/Category:Merlion_statues_(Merlion_Park)). These are the photographs measured and compared with the renders:
  - [Merlion statue, August 2023 - BugWarp 02](https://commons.wikimedia.org/wiki/File:Merlion_statue,_August_2023_-_BugWarp_02.jpg) (and 01, 04): a near-side profile from the south-south-east. The side profile (head, mane hems, fin, body, curl, waves, drum) was measured on it at 83.7 px/m, scaled from the foot of the waves (y 1645) to the top of the head (y 925).
  - [Lion Fountain (31811443050)](https://commons.wikimedia.org/wiki/File:Lion_Fountain_(31811443050).jpg) (12 December 2016): the front, used for the widths of the hood (about 2.7 m), face (about 1.9 m) and body (about 1.8 m).
  - [Singapore Merlion viewed from The Stamford](https://commons.wikimedia.org/wiki/File:Singapore_Merlion_viewed_from_The_Stamford.jpg) (3 November 2015): a telephoto view from 734 m away and some 200 m up, nearly orthographic. It gives a pure profile (bearing evidence), the length of the waves (about 6.7 m) and the drum's edge 3.5 m ahead of the body.
  - [Singapore Merlion BCT](https://commons.wikimedia.org/wiki/File:Singapore_Merlion_BCT.jpg) (7 November 2008), [Merlion Park 22 Dec 2024](https://commons.wikimedia.org/wiki/File:Merlion_Park_22_Dec_2024.jpg), [Merlion Park Fountain (2025)](https://commons.wikimedia.org/wiki/File:Merlion_Park_Fountain_(2025).jpg) and [(Back, 2025)](https://commons.wikimedia.org/wiki/File:Merlion_Park_Fountain_(Back,_2025).jpg), [Singapore Merlion Park, August 2023](https://commons.wikimedia.org/wiki/File:Singapore_Merlion_Park,_August_2023.jpg): three-quarter views, the tiled waves with their crest and balls, the drum, and the jet's arc and splash.
  - [Rear view of the Merlion statue … 20140307](https://commons.wikimedia.org/wiki/File:Rear_view_of_the_Merlion_statue_at_Merlion_Park,_Singapore,_with_Marina_Bay_Sands_in_the_distance_-_20140307.jpg), [Close up of Merlion](https://commons.wikimedia.org/wiki/File:Close_up_of_Merlion.jpg) (side, back and face), [Merlion Closeup Large](https://commons.wikimedia.org/wiki/File:Merlion_Closeup_Large.JPG) (the nozzle pipe in the mouth): the back of the hood, its tiers and grooves, the face.
  - [Singapore Merlion in 1978](https://commons.wikimedia.org/wiki/File:Singapore_Merlion_in_1978.jpg): at its first site, on its own cement waves. The waves belong to the sculpture (they were retiled blue in 2002), so the 8.6 m is taken from their foot.
  - The cub: [Small replica of Merlion](https://commons.wikimedia.org/wiki/File:Small_replica_of_Merlion.jpg) and [… Merlion3](https://commons.wikimedia.org/wiki/File:Small_replica_of_Merlion3.jpg) (Fernando Archuby, 17 August 2023; front and side), [Small Merlion](https://commons.wikimedia.org/wiki/File:Small_Merlion.JPG) (Terence Ong, April 2006; its basin) and [Singapore Mini Merlion](https://commons.wikimedia.org/wiki/File:Singapore_Mini_Merlion.JPG) (22 February 2015).
  - (*Merlion Profile Singapore* in the same category shows the former Sentosa Merlion and was not used.)

The reference photographs stay outside the repository.

## Anchoring and bearing

No OSM building is replaced: `tools/city/cities/singapore.mjs` registers `{ id: 'merlion', model: 'merlion', at: [1.286784, 103.854504] }` and hides nothing. The build anchors the model at the centre of way 182819157 (x 131.4, z −437.2), and `site.parts` is empty. The statue's axis is the anchor. The cub's rock is placed 22.57 m west and 1.49 m north of it with `kit.compass` (−19.97, +10.63 in the city's frame). The test checks that position against node 6283080658 through `tools/city/frame.mjs`; it is 0.05 m off, the anchor's rounding.

**Bearing 75° (ENE).** The published accounts say "east"; four independent checks put it about 15° north of that.
- **Aerial splash.** The splash on the aerial lies 12.9 m from the anchor at 74.7°.
- **Aerial streak.** The streak from the head measures 66°. It is biased low by the parallax of the elevated mouth: the head's blob sits about 2.5 m east and 1 m south of its base, an image roughly 17° off nadir from the west-north-west. Corrected, it gives about 74°.
- **Stamford telephoto.** It shows a pure left profile from bearing 166°, so the statue faces 76°.
- **Side photograph.** BugWarp 02's profile against the Stamford tower gives roughly 61°, uncertain because the lens's field of view is not known.

The cub faces **270° (west)**, away from the Merlion and toward the park. In the 2023 front view, the Singapore Flyer (72°) and the ArtScience Museum (118°) stand either side of its face (about 273°). In the side view, the Esplanade Bridge and the Esplanade's domes stand behind it (about 275°).

## Dimensions

The statue is measured in metres from the drum's top. *u* is ahead of the axis along 75°, *v* to its side. The city's ground at the anchor is y 0; the drum's top is y 0.35.

| Part | Value | Source |
| --- | --- | --- |
| Statue, foot of the waves to top of head | 8.6 | published (Roots.sg, Wikipedia); the waves are taken as part of it (1978 photograph) |
| Waves at the statue's foot / crest ahead | 1.11 / 1.72 high, about 6.2 m long, 3.9 m wide | measured (side photo, Stamford view) / estimated width |
| Body depth × width | 3.1 × 1.8 (scales 0.5 m across, rows 0.27 m) | measured side; width from the front photo |
| Mane: back at −1.84, lowest hem 4.12 at the back, tiers at 5.1, 5.6, 6.45 | | measured (side photo) |
| Hood width / face width | 2.7 / 2.1 | measured (front photo), ±0.2 |
| Snout, u 1.73 at 7.6; mouth 6.68–7.16, back at u 0.62; chin 6.3 | | measured (side photo) |
| Eyes at 7.9, 31° either side of the nose: almond sockets 0.4 × 0.2 m, eyeballs 0.22 m; ears to 8.6 | | measured / estimated |
| Fin (the tail's tip) under the chin, u 1.95 at 5.45, 0.84 m across | | measured (side, front photos) |
| Curl and its eye on each flank: centre (0.42, 2.49), r 0.72; eye (0.6, 2.41), r 0.22 | | measured (side photo) |
| Nozzle: u 0.6 → 1.36 at 6.92 (y 7.27), 0.17 m square | | measured (closeup); its section estimated |
| Drum: radius 3.85 (rim 3.92), centre u 0.95, front edge u 4.8, from the water (−2.2) to y 0.35 | | aerial and Stamford view; its height is the city's (2.55 m; about 3–3.6 m above the real water) |
| Cub: 2.0 tall on a rock 0.6 high, 1.1 × 1.0 m, in a basin 2.5 × 3.1 m (rim 0.45, water 0.40, curb 0.32) | | published height; rock and basin estimated from the 2006 and 2023 photographs |

**Jets.** The Merlion's jet leaves the nozzle at 7.72 m/s along 75° and 1.09 m/s up, slightly upward as the profiles show. It is in the air 1.5 s and lands in the bay 12.98 m out from the axis (11.6 m from the mouth), as on the aerial: 8.2 m beyond the drum, in line with the face, at `floor: -2.2`. The cub's dribble leaves its mouth at 0.95 m/s westward and 0.5 m/s down. It lands in its basin 0.5 m ahead of the mouth, clear of the rock, at `floor: 0.4`, the basin's water.

## Construction and palette

Each statue is a stack of lofts between horizontal rings: 72 rays round the Merlion's body and 80 round its head (closer together across the face than behind), and 30 and 40 round the cub. The sections are 6.5 cm apart up the body (5 cm across the curl's eye), 9 cm up the hood and fin, and 5 cm through the face. There are breaks at every hem (and the rounds of their edges), the fin's top, the chin, the lips, the nostrils, the eyes and the brow. Each ring comes from the measured profiles.

Every relief term is continuous in height and round the axis: smoothstep and cosine falloffs, no steps, so neighbouring rings and rays never jump and the surface stays smooth between them. The only crisp edges are the lips of the open mouth. The details:

- **Shapes.** Each ring is the union of superellipses for the fish's body, the fin, the hood, the skull, the muzzle and the jaw, all along rays from the axis. Each part grows out of or sinks into the others at the ends of its range.
- **Scales.** They sit on a staggered lattice, every other row half a scale over. Each scale is a fan that rises toward its scalloped lower edge and rolls over in a 5 cm lip onto the scale below. Where scales overlap, the uppermost shows, so the relief is creased only where scales meet.
- **Tail and curl.** The tail's smooth band runs up the front, with a groove along each side. On each flank the curl is a raised disc with a rounded rim and a spiral groove, and the fan of the tail's fin is ribbed. The curl's eye is a smooth round bowl with a raised rim. A dark ball at the bottom of the bowl shows as a round dark hole within it.
- **Hood.** Broad cosine grooves run 20° apart down the hood, with a deeper one down the middle of its back. The tiers step down its back, each hem rolling under in a 5 cm quarter round.
- **Face.** A brow ridge and a nose pad with its nostrils. The almond eye sockets are sunk into the face under the brow, each with a slightly raised lid round it and an eyeball sitting in it. Each eyeball has a dark reddish-brown iris; the cub's eyes are dark blue glass balls.
- **Mouth.** The open mouth cuts everything ahead of its throat away between its corners, so it gapes from the side as well as the front. The caps that meet its floor and palate are dark.
- **Separate parts.** The ears, the teeth (two fangs a jaw and two small upper teeth), the eyeballs and the curl's dark balls are small lofts set into the head or body. Their rings lie between the host's sections, so that no two tops share a height.
- **The cub.** It is the same form with its face set lower under a taller crown, as its photographs show (its hems at 0.41 of its height, its chin at 0.66 and its nose at 0.77 against the Merlion's 0.40, 0.69, 0.87), at 0.315 of the Merlion's depth and 0.26 of its width.

Palette: the statue is off-white (`#e9e8e2`), with the mouth's shadow, the irises, the nostrils and the curl's eye a dark reddish brown (`#3a2a27`). The waves are bands of deep blue (`#24479a`), mid blue (`#5d93d0`) and white-blue tile (`#dbe6ee`). The drum is grey granite (`#a39b8d`) in three courses over a darker wet course (`#5e5f55`), with a pale coping (`#cdc8bd`, also the nozzle and the basin's curb). The cub's basin rim is dark granite (`#4a4c4e`) and its water a dark glass (`#3d575c`). Ten material batches, each with its Tiny counterpart; the preview counts 11 with the jets' sprite mesh.

Collision covers the drum's top, the statue's body and head, the cub and its basin. The bay beyond the drum is open.

## Limitations

- **The curl's eye.** On the statue it is a hole right through the curl. Here it is a round bowl 0.3 m deep on each flank with a dark ball at its bottom, because a section can only be one ring round the axis.
- **Undersides.** The kit triangulates a loft's underside with its top ring's triangulation. On 24 of the 300 or so sections this folds by up to a few per cent of the section's area, where the scales make the rings uneven. The folds face down inside the body and do not show in the renders.
- **Scales and grooves.** The scales are rows of raised scallops, without the fan ribs on each scale, and only 5 rays wide each. The hood's grooves run straight down rather than sweeping back, and the side lappets' hems are level rather than sloping toward the chest.
- **Face.** The whiskers are left out, and the eyes are smaller than on the statue. The teeth are a fang at each corner of each jaw and two small upper teeth.
- **Waves.** They are seven nested tiled bands rising to their crest. The breaking curl of the front crest and the tiles' joints are left out.
- **Drum.** Its block joints are shown as horizontal courses only. The hedge planter on its west side and the platform's steps and railings are not modelled; the steps belong to the city.
- **Heights.** The drum is shorter than the real one because the city's water lies 2.2 m below its ground.
- **The cub.** Its porcelain mosaic is not modelled. Its basin's shape is estimated from the 2006 photograph (oval, the long axis across its facing); the 2023 photographs show the same rim surrounded by potted shrubs.
- **Tail.** The Merlion's tail curls up its front to the fin under the chin and into the curl near its foot; it does not curl behind. There is no fin along its back. Both follow the photographs.

## Verification

```text
node --test tests/landmark-merlion.test.cjs tests/landmark-kit.test.cjs   # 33 tests, 33 pass
node --test tests/landmark-models.test.cjs tests/landmark-kit.test.cjs    # 71 tests, 71 pass
```

The Merlion tests check:
- **Anchor and height.** The real anchor with nothing hidden, the documented 8.6 m from the waves' foot, and the drum from the water to just above the lawn.
- **Bearing and form.** The 75° bearing (snout ahead, mane behind), the fish's body deeper than wide and narrower than the hood, the fin standing proud of the throat, the hood's hem overhanging the body.
- **Relief.** At least seven rows of scales and three tiers on the back of the mane.
- **The Merlion's jet.** It leaves the nozzle with the mouth open ahead and the jaws above and below, then lands 11–14 m out in the bay, at least 6 m past the drum.
- **The cub.** It stands at the OSM node, 2 m tall, facing west, with its dribble landing in its basin clear of the rock.
- **Integrity.** Nothing floats and the sections run unbroken; finite geometry, no flicker, 58,838 triangles (within the 60,000 hero budget agreed for this model) and 10 batches; solid to walk into, open over the bay.

Renders were made in headless Chrome from `tools/landmark-preview.html?model=merlion` in both looks: the four views, close-ups at 3× of the side, front, back and three-quarter views, and the cub alone. They were compared side by side with BugWarp 02 (side), *Lion Fountain* (front), *Merlion Park 22 Dec 2024* (three-quarter from the pier), *Close up of Merlion* (back) and the cub's 2023 front and side photographs. A second round replaced every stepped relief (scales, tiers, grooves, the cut over the chest, the fin's ends, painted eyes) with continuous ones and was checked on the same close-ups. The live city was not rendered here.
