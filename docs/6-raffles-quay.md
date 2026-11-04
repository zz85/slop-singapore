# 6 Raffles Quay (SG-017)

The model covers the former John Hancock Tower at Telegraph Street, including the car park above the ground-floor retail. The National Library's 2016 account establishes the building's former names and its 25-storey count. [National Library Board](https://biblioasia.nlb.gov.sg/all-sections/vol-12-issue-3-oct-dec-2016-as-good-as-gold/)

## References

- JLL's September 2017 photograph shows the rounded blue-glass corner, horizontal silver-grey bands, deep dark vertical seams and heavier podium. JLL's March 2024 sale particulars identify the sheltered drop-off and parking on levels 3–9. [JLL property record](https://property.jll.com.sg/office-lease/singapore/raffles-place-and-vicinity/6-raffles-quay-sgp-p-0000sp), [2024 photographs and JLL particulars](https://www.edgeprop.sg/property-news/office-unit-6-raffles-quay-sale-188-mil)
- The Raffles Quay and Telegraph Street elevations show the framed stone panels and the way the rounded glazing runs past the parking levels. Both views were checked on 4 November 2026. [CBD Office Space](https://www.cbdofficespace.com.sg/6-raffles-quay), [OfficeMatch](https://www.officematch.com.sg/property/6-raffles-quay)
- Esri imagery viewed on 4 November 2026 shows the rounded roof perimeter and inset mechanical structures. The imagery is oblique and its capture date is unspecified. [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9)

## Footprint and massing

The 25 October 2026 city extract has one replacement, [way 47345004](https://www.openstreetmap.org/way/47345004), with no member parts, enclosing building relation or inner rings. It spans about 43 m along Raffles Quay and 31 m across the deepest rear projection. The drawing starts at 103.8516294°E, 1.2818874°N and runs along bearings 212° (towards Telegraph Street) and 302° (inland). The rear service projection is part of the same building. One Raffles Quay, Ascott Raffles Place and AIA Tower occupy separate sites.

The 112 m model top follows the OSM height tag pending a surveyed height. A leasing microsite gives 86.18 m without identifying its datum. The mapped `building:levels=27` differs from JLL's 25 storeys. The modeled garage shoulders end at 31 m, the office façade at about 106 m, and the plant rises in two setbacks inside the roof outline. Those divisions, the 4.8 m soffit and the depth of the sheltered drop-off are visual estimates. [Leasing microsite](https://6rafflesquay.com/index.html)

## Verification

- The generated city has both new anchors and 15,882 generic building solids, down from 15,887 across the two sites. Hong Leong's envelope was already suppressed by its mapped parts. All 71,784 trees were retained. Ascott Raffles Place, One Raffles Quay, AIA Tower and Lau Pa Sat remain separately identified.
- All 119 targeted checks and all 561 Linux checks passed. The geometry tests cover the drop-off clearance, solid garage overhead, roof margin, enclosed plant, exact replacement and geometry budget.
- The preview uses 1,420 triangles and 11 material batches. Checked both looks in WebGL and WebGPU, including the roof, street and rear elevations, and inspected the loaded city at map distance. The preview reported zero coplanar overlaps. The city logged Chrome's Windows WebGPU adapter preference notice.
- [Four-view preview](images/6-raffles-quay-overview.png) and [loaded city](images/6-raffles-quay-city.jpg). Locally, use `/tools/landmark-preview.html?model=6-raffles-quay&view=e&look=day` and `/?look=tiny&at=6-raffles-quay&camera=map&yaw=150&pitch=60&dist=340`.
