# Prudential Tower (SG-012)

This model covers Raymond Woo's 1998 office tower at 30 Cecil Street, with the post-refurbishment entrance documented in 2024–26.

## References

- [DesignSingapore's 2016 President's Design Award profile, with Max Ooi's tower photograph](https://pda.designsingapore.org/award-recipients/2016/raymond-woo/) identifies the curved granite elevation and its relationship to the junction and the former Equity Plaza.
- [JLL's 2017 side elevation](https://property.jll.com.sg/office-lease/singapore/raffles-place-and-vicinity/prudential-tower-sgp-p-006362) shows the granite piers against the wraparound window bands and the deep podium. [One Tree Partners' 2017 property photographs](https://www.onetreepartners.com/private-equity/prudential/) show the inset upper wall and high vertical shoulders.
- [Lum Chang's construction account](https://www.lumchang.com.sg/projects_uri/prudential-tower-4/) identifies the roof penthouse as a decorative enclosure for mechanical and electrical services. [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9), viewed 4 November 2026, shows the long central plant strip and transverse structures within the roof perimeter. The imagery capture date is unspecified.
- [CommercialGuru's September 2026 listing photography](https://www.commercialguru.com.sg/listing/for-sale-prudential-tower-25440030) shows the recessed glass entrance under a granite beam with dark building lettering. [Prudential's 2025 sustainability brief](https://www.prudential.com.sg/-/media/project/prudential/pdf/reports/sr-report/2025/srpillar3.pdf) documents the move to Labrador Tower in June 2025. The model uses the entrance lettering documented in 2026.

## Footprint and massing

The 25 October 2026 local OSM extract has [way 171999306](https://www.openstreetmap.org/way/171999306) for the 20 m podium envelope and [way 326926563](https://www.openstreetmap.org/way/326926563) for the 145 m shaft. These are the two replacements. There are no building relations or inner rings. Samsung Hub ([146335667](https://www.openstreetmap.org/way/146335667)) shares two vertices at the northwestern end of the podium and remains a separate building.

The mapped podium spans approximately 60 by 55 m in a frame running 150° and 240° clockwise from true north from 103.8499301°E, 1.2831552°N. The tower uses the mapped shaft plan and the rounded corner faces the junction. The model uses 20 m for the podium and 145 m for the plant crown. The recessed entry, the main office roof around 131 m and the higher plant enclosure are visual estimates. The entry is open between the street and the glazing under the upper podium.

## Verification

- The city generator retained 71,784 trees and added both new landmark anchors. The generic building count fell from 15,892 to 15,887 across the two sites. Two of the seven mapped ways were already suppressed as overlapping outlines. The site test checks that Samsung Hub and the Ascott neighbours remain separately named and that the two generic landmark duplicates are gone.
- All 105 targeted checks and all 556 checks in the full Linux suite passed. Probes check the steel entry columns, clear approach, solid overhang, roof plant and clear air beyond the curved shaft.
- The preview uses 1,126 triangles and 11 material batches. Checked Tiny and daylight in WebGL and WebGPU from the east, rear and roof, and inspected the loaded city. Both previews reported zero coplanar overlaps. Chrome logged its Windows WebGPU adapter preference notice in the city.
- [Four-view preview](images/prudential-tower-overview.png) and [city view](images/prudential-tower-city.jpg). With the repo served locally, use `/tools/landmark-preview.html?model=prudential-tower&view=e&look=day` or `/?look=tiny&at=prudential-tower&camera=map&yaw=91&pitch=62&dist=455`.

The roof plant, rear elevation and entrance glazing use simplified geometry. Narrow façade details follow the photographs at miniature scale.
