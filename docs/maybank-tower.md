# Maybank Tower (SG-009)

This is the 32-storey Maybank Tower at 2 Battery Road. Its slate-blue glazing and silver horizontal bands rise from a low curved podium beside Cavenagh Bridge. The model uses the established exterior silhouette and the publicly documented 2024 lobby era.

## References

- [CTBUH building entry](https://www.skyscrapercenter.com/building/wd/2512) records SYL Architects, 32 storeys and a 175.3 m architectural height.
- [Orderinchaos's Anderson Bridge view, 11 November 2016](https://commons.wikimedia.org/wiki/File:Anderson_Bridge_view_south_to_Maybank,_BoC_etc.jpg) shows the river elevation, continuous silver spandrels and the podium edge next to the promenade.
- [Bob T's aerial view, 15 October 2018](https://commons.wikimedia.org/wiki/File:Aerial_panorama_of_Singapore%27s_Downtown_Core_%28Maybank_Tower%29.jpg) shows the roof profile, pale crown and yellow signboard, and the glazed river lobby.
- [Sengkang's street elevation, August 2006](https://commons.wikimedia.org/wiki/File:Maybank_Tower_3,_Aug_06.JPG) shows the wrapped glazing and rounded podium. [Maybank's November 2024 opening announcement](https://www.maybank2u.com.sg/en/personal/about_us/maybank-singapore/newsroom/2024/25-nov-2024.page) establishes the current branch use and river-facing glazing.

## Footprint and massing

The OSM snapshot dated 25 October 2026 supplies the following separate way records. No enclosing building relation or inner rings were found for this site.

| Way | Mapped role |
| --- | --- |
| [106193386](https://www.openstreetmap.org/way/106193386) | Zero-height site outline |
| [1075240989](https://www.openstreetmap.org/way/1075240989) | Five-level rounded podium, about 22 × 49 m |
| [1075240988](https://www.openstreetmap.org/way/1075240988) | Combined tower plan, about 22 × 38 m, tagged to 175 m |
| [325793730](https://www.openstreetmap.org/way/325793730) | Narrow rectangular high roof, tagged to 175 m |
| [1075553558](https://www.openstreetmap.org/way/1075553558) | Adjoining skillion roof outline |

The model replaces these five ways. Bank of China at 4 Battery Road, the Fullerton Hotel and the river promenade are separate. The model reuses the generated rings directly. Its lower lobby is recessed from the podium edge, with solid volume inside the exterior glazing. The podium top at about 21 m and the start of the crown near 157 m are photo estimates. The roof combines the mapped high rectangle and sloping extension. The grade of the slope and the trim are approximate.

## Verification

- The generated city anchor uses all five replacement ways. Tests probe the rounded podium roof, solid high crown, stepped collision below the sloping wing, river setback and clear promenade.
- The guide's targeted suite passed 99 checks. The complete Node suite passed 544 checks on Linux.
- The model uses 892 triangles and eight material batches. The kit reports zero coplanar overlaps. Checked Tiny and daylight in WebGL and WebGPU, plus the loaded Tiny city view. The bands, podium and crown were compared with the river, aerial and street photographs.
- [Four-view preview](images/maybank-tower-overview.png) and [city view](images/maybank-tower-city.png). With the repo served locally, use `/tools/landmark-preview.html?model=maybank-tower&view=n&look=day` for the river elevation and `/?look=tiny&at=maybank-tower&camera=map&dist=730&pitch=56&yaw=180` for the city view.

The sloped roof collision uses conservative 2 m steps above the eaves. Window framing, the tiger roundel and the branch frontage are simplified.
