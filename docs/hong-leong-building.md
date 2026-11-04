# Hong Leong Building (SG-024)

The model depicts 16 Raffles Quay after the 2025 refurbishment. The tower retains the original granite and the podium has bronze-toned ventilation screens above recessed walks and retail glazing. [TA.LE Architects' June 2026 photographs and completion record](https://talearchitects.com.sg/portfolio/hong-leong-building/)

## References

- The owner provides two earlier street elevations showing the tower's continuous silver fins, dark windows, low glass shoulder and straight roofline. The 2018 photograph by Bjoertvedt shows the relationship to Cross Street and Lau Pa Sat. [Hong Leong Holdings](https://hongleongholdings.com.sg/hong-leong.html), [Bjoertvedt photograph](https://commons.wikimedia.org/wiki/File:Singapore_-_Raffles_Quay_16_-_Hong_Leong_Building_IMG_9668.jpg)
- The completed 2025 podium is documented in the architect's Cross Street elevation, corner views and walkway photographs. The parking levels remain naturally ventilated. [TA.LE Architects](https://talearchitects.com.sg/portfolio/hong-leong-building/)
- Esri imagery viewed on 4 November 2026 shows the broad rear parking roof and the raised plant inside the narrower tower perimeter. The imagery is oblique and its capture date is unspecified. [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9)

## Footprint and massing

Five ways in the 25 October 2026 OSM snapshot form the site. There are no building relations or inner rings. The stepped podium spans about 60 × 70 m and the mapped shaft measures about 32 × 41 m. The base drawing starts at 103.8508941°E, 1.2817428°N, with axes along bearings 121.3° and 211.3°. The tower occupies the south-east portion of the podium, beside a lower deck and a raised shoulder. The separate Lau Pa Sat roofs and the gap across Telegraph Street belong to their own sites.

| Replaced way | Mapped role | Model |
| --- | --- | --- |
| [47345013](https://www.openstreetmap.org/way/47345013) | Building envelope | Stepped podium outline |
| [560203760](https://www.openstreetmap.org/way/560203760) | Office slab, 158 m | Granite fins, strip glazing and enclosed roof plant |
| [1566685786](https://www.openstreetmap.org/way/1566685786) | Upper podium, 33–38 m | Set-back shoulder around the tower |
| [1566685787](https://www.openstreetmap.org/way/1566685787) | Parking podium, 33 m | Banded garage screen over the covered walk |
| [1566685788](https://www.openstreetmap.org/way/1566685788) | Two-level ground footprint | Recessed retail and lobby with separate street columns |

The model uses the mapped 33, 38 and 158 m height datums. The clear 6.5 m walk, 151 m main roof, setbacks inside the crown and depth of the ventilation screens are visual estimates. The podium is a solid collision volume over the street walk. Internal parking and the level-5 drop-off use simplified exterior geometry.

## Verification

- The generated anchor includes all five replacement ways. Together the two new landmarks remove five generic building solids, with the Hong Leong envelope already suppressed by its mapped parts. All 71,784 trees were retained and the Telegraph Street gap stays open between the two sites.
- All 119 targeted checks and all 561 Linux checks passed. Probes check the covered walkway, parking volume overhead, elevated deck, shaft, inset plant and clear air beyond the tower. The metadata tests check the addresses and adjacent sites.
- The preview uses 1,605 triangles and 11 material batches. Checked both looks in WebGL and WebGPU, including the roof, street and rear elevations, and inspected the loaded city at map distance. The preview reported zero coplanar overlaps. The city logged Chrome's Windows WebGPU adapter preference notice.
- [Four-view preview](images/hong-leong-building-overview.png) and [loaded city](images/hong-leong-building-city.jpg). Locally, use `/tools/landmark-preview.html?model=hong-leong-building&view=e&look=day` and `/?look=tiny&at=hong-leong-building&camera=map&yaw=70&pitch=59&dist=390`.
