
import { SalesRecord } from './types';

const rawData = `Data,FY,FY+Qtr,Half,sales,item name,customer name,Sector,Potential Partners,type of product, total amount (k) ,Date,VA/LLM/SSID/EDU,Win Rate%,B/L/W,Product type 2
Order,FY24,FY24Q2,H1,Julian,AAHK - T1 FR (Part 1),HK Airport,Transportation,GW,Xperience," 5,220 ",30-Jun-2024,Key Deal,100%,Worst,Xperience
Order,FY24,FY24Q2,H1,Sunny ,C&ED_Baggage Identification and Tracking System,C&ED,Govt,GW / LP (Lenovo PCCW),Xperience," 2,500 ",26-Jun-2024,Key Deal,100%,Worst,Xperience
Order,FY26,FY26Q3,H2,Sunny ,C&ED_AI_PrivateCloud ,C&ED,Govt,CMHK/ASL,"SenseStudio, SenseNova"," 20,000 ",26-Sep-2026,VA&LLM,75%,Likely,SenseNova
Order,FY24,FY24Q1,H1,Sunny ,GW_ Replenishment Order_Dec,C&ED,Govt,GW / LP (Lenovo PCCW),Xperience," 1,353 ",26-Mar-2024,Won,100%,Worst,Xperience
Rev,FY26,FY26Q4,H2,Joey,Ai Tool Box (HW),HKPF,Govt,CMHK,"SenseFoundry, Centurio"," 150,000 ",26-Dec-2026,VA,30%,Best,"SenseFoundry, Centurio"
Rev,FY27,FY27Q4,H2,Sunny ,C&ED_AI_PrivateCloud 2nd,C&ED,Govt,CMHK/CTG,"SenseStudio, SenseNova"," 14,000 ",26-Dec-2027,VA&LLM,50%,Likely,SenseNova
Rev,FY26,FY26Q4,H2,Joey,Ai Tool Box (SW),HKPF,Govt,CMHK,"SenseFoundry, Centurio"," 45,000 ",26-Dec-2026,VA,50%,Likely,"SenseFoundry, Centurio"
Order,FY26,FY26Q4,H2,Joey,Ai Tool Box (HW),HKPF,Govt,CMHK,"SenseFoundry, Centurio"," 150,000 ",26-Dec-2026,VA,30%,Best,"SenseFoundry, Centurio"
Rev,FY26,FY26Q4,H2,Joey,PF TSD Connect ,HKPF,Govt,HKPF,SenseFoundry," 20,000 ",30-Dec-2026,VA,30%,Best,SenseFoundry
Order,FY27,FY27Q3,H2,Sunny ,C&ED_T1 BIT System,C&ED,Govt,GW/LPS,Xperience," 9,000 ",20-Sep-2027,VA,30%,Best,Xperience
Order,FY24,FY24Q4,H2,Sunny ,C&ED_Baggage Identification and Tracking System(Hardware),C&ED,Govt,GW / LPS,Xperience," 2,650 ",30-Dec-2024,Key Deal,75%,Likely,Xperience
Order,FY24,FY24Q3,H2,Julian,AAHK-Baggage Hall-VO,HK Airport,Transportation,GW,Xperience, 424 ,30-Sep-2024,Won,100%,Worst,Xperience
Rev,FY24,FY24Q4,H2,Julian,AAHK-Baggage Hall-VO,HK Airport,Transportation,GW,SenseStudio, 425 ,7-Nov-2024,VA,100%,Worst,Xperience
Order,FY25,FY25Q4,H2,Julian,FOD 1st log,HK Airport,Transportation,GW,"SenseStudio, SenseSpring"," 7,500 ",26-Nov-2025,VA,100%,Worst,SenseStudio & Spring
Order,FY24,FY24Q1,H1,Joey,PF TSD 350 Cameras & 72 Cameras Test Bed,PF,Govt,GW,GW," 3,258 ",26-Jan-2024,Won,100%,Worst,SenseFoundry
Order,FY24,FY24Q2,H1,Joey,Property crack detection,Opulence,Properties,BoxAsOne,"SenseStudio, SenseSpring"," 1,290 ",26-Apr-2024,Won,100%,Worst,SenseStudio & Spring
Order,FY24,FY24Q2,H1,Joey,Opulence LLM,Opulence,Properties,BoxAsOne,SenseChat, 335 ,26-Apr-2024,Won,100%,Worst,SenseNova
Order,FY25,FY25Q1,H1,Julian,ACS Annual Main (4 yrs),HK Airport,Transportation,Chubb,SenseLink," 5,392 ",25-Mar-2025,Key Deal,100%,Worst,SenseLink
Rev,FY26,FY26Q4,H2,Julian,OXO AIDC consultancy,OXO,Service Provider,Eagletrend,Sensecore," 10,000 ",30-Dec-2026,AIDC,50%,Likely,Sensecore
Order,FY26,FY26Q3,H2,Sunny ,EMSD 新皇崗口岸 - Tong sir,EMSD/C&ED,Govt,CMHK/Micoware,"SenseFoundry, Centurio"," 8,190 ",26-Sep-2026,VA,30%,Likely,"SenseFoundry, Centurio"
Rev,FY26,FY26Q2,H1,Joey,"9 Custom Site -  C&ED  HW+ 1st Support, Part 1 - Ken ",C&ED,Govt,中鐵建,"SenseFoundry, Centurio"," 9,500 ",30-Jun-2026,VA,75%,Likely,SenseFoundry
Rev,FY27,FY27Q4,H2,Sunny ,Custom - 9 sites,C&ED,Govt,C&ED,SenseFoundry," 22,500 ",30-Dec-2027,VA,30%,Best,SenseFoundry
Rev,FY26,FY26Q4,H2,Sunny ,C&ED_T1 BIT System,C&ED,Govt,GW/LPS,Sensestudio ," 8,000 ",20-Dec-2026,VA,30%,Best,Sensestudio 
Rev,FY27,FY27Q1,H1,Julian,AAHK - ACS -Extension 7x24 (3rd yr),HK Airport,Transportation,Chubb,SenseLink, 188 ,26-Mar-2027,VA,50%,Likely,SenseLink
Rev,FY27,FY27Q2,H1,Julian,AAHK - ACS -Extension 7x24 (3rd yr),HK Airport,Transportation,Chubb,SenseLink, 188 ,26-Jun-2027,VA,50%,Likely,SenseLink
Rev,FY27,FY27Q3,H2,Julian,AAHK - ACS -Extension 7x24 (3rd yr),HK Airport,Transportation,Chubb,SenseLink, 188 ,26-Sep-2027,VA,50%,Likely,SenseLink
Rev,FY27,FY27Q4,H2,Julian,AAHK - ACS -Extension 7x24 (3rd yr),HK Airport,Transportation,Chubb,SenseLink, 188 ,26-Dec-2027,VA,50%,Likely,SenseLink
Rev,FY28,FY28Q1,H1,Julian,AAHK - ACS -Extension 7x24 (4th yr),HK Airport,Transportation,Chubb,SenseLink, 188 ,26-Mar-2028,VA,50%,Likely,SenseLink
Rev,FY28,FY28Q2,H1,Julian,AAHK - ACS -Extension 7x24 (4th yr),HK Airport,Transportation,Chubb,SenseLink, 188 ,26-Jun-2028,VA,50%,Likely,SenseLink
Rev,FY28,FY28Q3,H2,Julian,AAHK - ACS -Extension 7x24 (4th yr),HK Airport,Transportation,Chubb,SenseLink, 188 ,26-Sep-2028,VA,50%,Likely,SenseLink
Rev,FY28,FY28Q4,H2,Julian,AAHK - ACS -Extension 7x24 (4th yr),HK Airport,Transportation,Chubb,SenseLink, 188 ,26-Dec-2028,VA,50%,Likely,SenseLink
Order,FY25,FY25Q2,H1,Joey,PF TSD FY25(Nov)-26 350+72 Cams Maintenance ,HKPF,Govt,HKPF,SenseFoundry," 4,500 ",26-Jun-2025,VA,100%,Worst,SenseFoundry
Rev,FY24,FY24Q4,H2,Joey,PF FY24-25 350+72 Cams Main,HKPF,Govt,HKPF,"SenseFoundry, Centurio", 270 ,26-Dec-2024,VA,100%,Worst,SenseFoundry
Order,FY24,FY24Q4,H2,Joey,PF FY24-25 350+72 Cams Main,HKPF,Govt,HKPF,"SenseFoundry, Centurio"," 4,500 ",26-Nov-2024,Key Deal,100%,Worst,SenseFoundry
Rev,FY25,FY25Q4,H2,Sunny ,C&ED_Baggage Identification and Tracking System - T2 part 2,C&ED,Govt,GW,Xperience," 5,000 ",31-Dec-2025,VA,100%,Worst,Xperience
Order,FY26,FY26Q2,H1,Joey,"9 Custom Site -  C&ED PS,HW,SW",C&ED,Govt,中鐵建,SenseFoundry," 15,000 ",30-Jun-2026,VA,75%,Likely,SenseFoundry
Rev,FY26,FY26Q4,H2,Julian,T1 FRPSS Phase 2 (SW+PS),HK Airport,Transportation,GW,SenseStudio," 8,000 ",30-Dec-2026,VA,50%,Likely,SenseStudio
Rev,FY26,FY26Q3,H2,Sunny ,EMSD 新皇崗口岸(70%) - Tony sir,EMSD/C&ED,Govt,CMHK/Micoware,"SenseFoundry, Centurio"," 5,733 ",26-Sep-2026,VA,30%,Best,"SenseFoundry, Centurio"
Rev,FY27,FY27Q2,H1,Sunny ,"C&ED_AI_PrivateCloud 1st(SA&D, 30% of 20M)",C&ED,Govt,CMHK/Micoware,SenseFoundry," 6,000 ",26-Jun-2027,VA&LLM,50%,Likely,SenseNova
Rev,FY27,FY27Q2,H1,Sunny ,3 Custom Site -  C&ED SW,C&ED,Govt,Microware,SenseFoundry," 1,500 ",30-Jun-2027,VA,75%,Likely,SenseFoundry
Order,FY27,FY27Q2,H1,Julian,科大醫院 Sensecare,Macau 科大醫院,Govt,NetCraft,Sensecare," 1,000 ",30-Jun-2027,VA,30%,Likely,Sensecare
Rev,FY26,FY26Q2,H1,Joey,"9 Custom Site -  C&ED  HW+ 1st Support, Part 2 - Ken",C&ED,Govt,中鐵建,"SenseFoundry, Centurio"," 4,500 ",30-Jun-2026,VA,75%,Likely,SenseFoundry
Order,FY26,FY26Q1,H1,Joey,TSD Nebula x 9pcs,HKPF,Govt,HKPF,SenseFoundry, 128 ,26-Mar-2026,VA,100%,Worst,SenseFoundry
Rev,FY26,FY26Q4,H2,Joey,Innocontent - ebook IP right with Ai portal - PHase 2,Innocontent,Govt,Innocontent,SenseNova," 4,000 ",30-Dec-2026,LLM,50%,Likely,SenseNova
Order,FY26,FY26Q1,H1,Joey,PF TSD Foundry23 upgrade,HKPF,Govt,HKPF,SenseFoundry," 3,000 ",26-Mar-2026,VA,100%,Worst,SenseFoundry
Rev,FY27,FY27Q1,H1,Julian,AAHK - ACS -Extension (SW+PS),HK Airport,Transportation,GW/N1,SenseLink," 4,000 ",30-Mar-2027,VA,75%,Likely,SenseStudio & Spring
Rev,FY27,FY27Q1,H1,Sunny ,9 Custom Site -  C&ED SW + PS,C&ED,Govt,CMHK,"SenseStudio, SenseSpring"," 5,000 ",30-Mar-2027,VA,50%,Likely,SenseStudio & Spring
Rev,FY27,FY27Q4,H2,Sunny ,9 Custom Site -  C&ED PS,C&ED,Govt,CMHK,"SenseStudio, SenseSpring"," 6,000 ",30-Dec-2027,VA,50%,Likely,SenseStudio & Spring
Order,FY27,FY27Q1,H1,Sunny ,8 Custom Site -  C&ED 2nd support,C&ED,Govt,Miroware,"SenseStudio, SenseSpring", 50 ,30-Mar-2027,VA,75%,Likely,SenseStudio & Spring
Order,FY27,FY27Q2,H1,Sunny ,8 Custom Site -  C&ED 2nd support,C&ED,Govt,Miroware,"SenseStudio, SenseSpring", 50 ,30-Jun-2027,VA,75%,Likely,SenseStudio & Spring
Order,FY27,FY27Q3,H2,Sunny ,8 Custom Site -  C&ED 2nd support,C&ED,Govt,Miroware,"SenseStudio, SenseSpring", 50 ,30-Sep-2027,VA,75%,Likely,SenseStudio & Spring
Order,FY27,FY27Q4,H2,Sunny ,8 Custom Site -  C&ED 2nd support,C&ED,Govt,Miroware,"SenseStudio, SenseSpring", 50 ,30-Dec-2027,VA,75%,Likely,SenseStudio & Spring
Rev,FY27,FY27Q1,H1,Sunny ,8 Custom Site -  C&ED 2nd support,C&ED,Govt,Miroware,"SenseStudio, SenseSpring", 50 ,30-Mar-2027,VA,75%,Likely,SenseStudio & Spring
Rev,FY27,FY27Q2,H1,Sunny ,8 Custom Site -  C&ED 2nd support,C&ED,Govt,Miroware,"SenseStudio, SenseSpring", 50 ,30-Jun-2027,VA,75%,Likely,SenseStudio & Spring
Rev,FY27,FY27Q3,H2,Sunny ,8 Custom Site -  C&ED 2nd support,C&ED,Govt,Miroware,"SenseStudio, SenseSpring", 50 ,30-Sep-2027,VA,75%,Likely,SenseStudio & Spring
Rev,FY27,FY27Q4,H2,Sunny ,8 Custom Site -  C&ED 2nd support,C&ED,Govt,Miroware,"SenseStudio, SenseSpring", 50 ,30-Dec-2027,VA,75%,Likely,SenseStudio & Spring
Rev,FY27,FY27Q3,H2,Sunny ,9 Custom Site -  C&ED Service Part 2,C&ED,Govt,中鐵路,"SenseFoundry, Centurio"," 6,000 ",30-Sep-2027,VA,50%,Likely,SenseFoundry
Rev,FY27,FY27Q3,H2,Sunny ,9 Custom Site -  C&ED  Support (5yrs),C&ED,Govt,中鐵路,"SenseFoundry, Centurio"," 3,000 ",30-Sep-2027,VA,50%,Likely,SenseFoundry
Rev,FY26,FY26Q1,H1,Joey,PF TSD Foundry23 upgrade,HKPF,Govt,HKPF,SenseFoundry," 3,400 ",26-Mar-2026,VA,100%,Worst,SenseFoundry
Rev,FY26,FY26Q2,H1,Julian,AAHK - ACS -Extension (HW),HK Airport,Transportation,GW/N1/Mircoware,SenseLink," 3,000 ",30-Jun-2026,VA,75%,Likely,SenseStudio & Spring
Order,FY26,FY26Q4,H2,Joey,PF TSD Connect ,HKPF,Govt,HKPF,SenseFoundry," 20,000 ",30-Nov-2026,VA,50%,Likely,SenseFoundry
Rev,FY26,FY26Q4,H2,Julian,Legco VA 70%,Legco Department,Govt,HKT,SenseFoundry," 1,593 ",30-Dec-2026,VA,30%,Best,SenseFoundry
Order,FY26,FY26Q2,H1,Joey,Facial Recognition SDK into Firemen ,HKFSD,Govt,EBSL/Microware,SSID , 400 ,30-Jun-2026,VA,100%,Worst,SSID
Order,FY26,FY26Q2,H1,Joey,Ai Tool Box (SW),HKPF,Govt,CMHK/Micoware,"SenseFoundry, Centurio"," 45,000 ",26-Jun-2026,VA&LLM,75%,Likely,SenseFoundry
Order,FY25,FY25Q3,H2,Joey,Innocontent - ebook IP right with Ai portal Phase 1,Innocontent,Govt,Innocontent/Loyalmaster,SenseNova," 3,800 ",30-Sep-2025,LLM,100%,Worst,SenseNova
Rev,FY24,FY24Q4,H2,Joey,PF FY25-26 350+72 Cams Main,HKPF,Govt,HKPF,"SenseFoundry, Centurio", 720 ,26-Dec-2024,VA,100%,Worst,SenseFoundry
Rev,FY24,FY24Q2,H1,Joey,EVI Smart Campus - 24Q2,EVI ,Education,EVI,K12 platform, 80 ,26-Jun-2024,EDU,100%,Worst,SenseEDU
Order,FY24,FY24Q2,H1,Joey,EVI Smart Campus - 24Q2,EVI ,Education,EVI,K12 platform, 80 ,26-Jun-2024,Won,100%,Worst,SenseEDU
Order,FY24,FY24Q2,H1,Joey,ECU School Tour (1st),ECU,Education,ECU,"SenseStorm3.0,SenseEDU,Tours", 160 ,26-Jun-2024,Won,100%,Worst,SenseEDU
Order,FY24,FY24Q2,H1,Joey,JYC SenseStudy Extension,鄭余雅穎培菁女性創效基金有限公司,Education,HKT or others,K12 platform, 10 ,26-Jun-2024,Won,100%,Worst,SenseEDU
Order,FY24,FY24Q4,H2,Joey,PF CSTCB LLM (PO1+PO2),HKPF,Govt,HKPF,SenseNova," 2,300 ",26-Dec-2024,Key Deal,75%,Worst,SenseNova
Rev,FY24,FY24Q2,H1,Joey,JYC SenseStudy Extension,鄭余雅穎培菁女性創效基金有限公司,Education,HKT or others,K12 platform, 10 ,26-Jun-2024,EDU,100%,Worst,SenseEDU
Order,FY24,FY24Q1,H1,Julian,SHK PC Mall After-Sales Consultancy Serv,SHK,Properties,GW,SenseInsight, 81 ,26-Feb-2024,Won,100%,Worst,SenseStudio & Spring
Order,FY24,FY24Q1,H1,JUDGED,Q1 Order +/- due to currency or finanical management ,Other,Other,Other,Other, 151 ,26-Mar-2024,Won,100%,Worst,Other
Order,FY24,FY24Q1,H1,Joey,HKE Smart Building,HKE,Utilities,"GW, Chubb","SensePass,SenseStudio"," 1,248 ",26-Mar-2024,Won,100%,Worst,SenseStudio & Spring
Rev,FY24,FY24Q4,H2,Julian,AAHK - T1 FR People Tracking System (part 2a) - NAS,HK Airport,Transportation,GW ,Xperience," 2,299 ",30-Dec-2024,VA,100%,Worst,Xperience
Order,FY25,FY25Q2,H1,Sunny ,C&ED_Baggage Identification and Tracking System(SW & Service 35%),C&ED,Govt,GW to LPS,Xperience," 3,186 ",20-Jun-2025,VA,100%,Worst,Xperience
Order,FY24,FY24Q3,H2,Julian,Escalator Safety phase 2,MTR,Transportation,GTI,"SenseStudio, SenseSpring", 900 ,26-Jul-2024,Won,100%,Worst,SenseStudio & Spring
Order,FY24,FY24Q1,H1,Joey,ECU Education Platform,ECU,Education,ECU,"SenseStorm3.0,SenseEDU,Tours", 715 ,26-Mar-2024,Won,100%,Worst,SenseStudio & Spring
Rev,FY25,FY25Q2,H1,Sunny ,C&ED_Baggage Identification and Tracking System(SW & Service 35%),C&ED,Govt,GW,Xperience," 3,186 ",30-Jun-2025,VA,100%,Worst,Xperience
Rev,FY27,FY27Q1,H1,Julian,Jockey Club Conghua AI - SSID,Jockeyclub,Service Provider,HKT,SSID, 38 ,30-Mar-2027,SSID,75%,Likely,SSID
Rev,FY27,FY27Q2,H1,Julian,Jockey Club Conghua AI - SSID,Jockeyclub,Service Provider,HKT,SSID, 38 ,30-Jun-2027,SSID,75%,Likely,SSID
Rev,FY25,FY25Q4,H2,Julian,FOD 1st log,HK Airport,Transportation,GW,"SenseStudio, SenseSpring"," 7,354 ",31-Dec-2025,VA,100%,Worst,SenseStudio & Spring
Order,FY25,FY25Q4,H2,Joey,PF TSD SenseFoundry License addon - 1st,HKPF,Govt,HKPF,SenseFoundry, 300 ,30-Dec-2025,VA,100%,Worst,SenseFoundry
Order,FY26,FY26Q3,H2,Sunny ,C&ED_AI_PrivateCloud (HW),C&ED,Govt,CMHK/ASL,"SenseStudio, SenseNova"," 50,000 ",26-Sep-2026,VA&LLM,30%,Best,SenseNova
Order,FY26,FY26Q3,H2,Julian,T1 FRPSS Phase 2,AA,Transportation,GW,"SenseStudio, SenseSpring"," 8,000 ",30-Dec-2026,VA,50%,Best,SenseStudio & Spring
Order,FY25,FY25Q3,H2,Julian,ABC Main. - Customisation 8x5,AA,Utilities,GW,"SenseStudio, SenseSpring", 900 ,30-Sep-2025,VA,100%,Worst,SenseStudio & Spring
Rev,FY25,FY25Q4,H2,Joey,PF TSD SenseFoundry License addon - 1st,HKPF,Govt,HKPF,SenseFoundry," 1,200 ",31-Dec-2025,VA,100%,Worst,SenseFoundry
Rev,FY25,FY25Q4,H2,Joey,PF FY25-26 350+72 Cams Main,HKPF,Govt,HKPF,SenseFoundry," 1,112 ",26-Dec-2025,VA,100%,Worst,SenseFoundry
Rev,FY26,FY26Q2,H1,Julian,AAHK - ACS -Extension (SW),HK Airport,Transportation,GW/N1/Mircoware,SenseLink," 2,000 ",30-Jun-2026,VA,75%,Likely,SenseStudio & Spring
Rev,FY26,FY26Q2,H1,Joey,PF FY25-26 350+72 Cams Main (2025-2026),HKPF,Govt,HKPF,"SenseFoundry, Centurio"," 1,112 ",30-Jun-2026,VA,100%,Worst,SenseFoundry
Rev,FY26,FY26Q3,H2,Joey,PF FY25-26 350+72 Cams Main (2025-2026),HKPF,Govt,HKPF,"SenseFoundry, Centurio"," 1,112 ",30-Sep-2026,VA,100%,Worst,SenseFoundry
Rev,FY26,FY26Q4,H2,Joey,PF FY25-26 350+72 Cams Main (2025-2026),HKPF,Govt,HKPF,"SenseFoundry, Centurio"," 1,112 ",30-Dec-2026,VA,100%,Worst,SenseFoundry
Rev,FY26,FY26Q1,H1,Joey,PF FY25-26 350+72 Cams Main (2025-2026),HKPF,Govt,HKPF,"SenseFoundry, Centurio"," 1,112 ",31-Mar-2026,VA,100%,Worst,SenseFoundry
Rev,FY26,FY26Q4,H2,Julian,科大醫院 Sensecare,Macau 科大醫院,Govt,NetCraft,Sensecare," 1,000 ",30-Dec-2026,VA,30%,Best,Sensecare
Rev,FY26,FY26Q3,H2,Sunny ,"3 Custom Site  (深圳灣&港珠澳, 河套)-  C&ED HW 1",C&ED,Govt,Direct,SenseFoundry, 900 ,30-Sep-2026,VA,75%,Likely,SenseFoundry
Rev,FY26,FY26Q3,H2,Sunny ,"3 Custom Site  (深圳灣&港珠澳, 河套)-  C&ED HW 2",C&ED,Govt,Direct,SenseFoundry, 900 ,30-Jun-2026,VA,75%,Likely,SenseFoundry
Order,FY26,FY26Q3,H2,Sunny ,"3 Custom Site  (深圳灣&港珠澳, 河套)-  C&ED HW 2",C&ED,Govt,Direct,SenseFoundry, 900 ,30-Jun-2026,VA,75%,Likely,SenseFoundry
Rev,FY26,FY26Q3,H2,Sunny ,"3 Custom Site  (深圳灣&港珠澳, 河套)-  C&ED HW 3",C&ED,Govt,Direct,SenseFoundry, 900 ,30-Jun-2026,VA,75%,Likely,SenseFoundry
Order,FY26,FY26Q3,H2,Sunny ,"3 Custom Site  (深圳灣&港珠澳, 河套)-  C&ED HW 3",C&ED,Govt,Direct,SenseFoundry, 900 ,30-Jun-2026,VA,75%,Likely,SenseFoundry
Rev,FY26,FY26Q4,H2,Sunny ,"3 Custom Site  (深圳灣&港珠澳, 河套)-  C&ED HW 4",C&ED,Govt,Direct,SenseFoundry, 900 ,30-Jun-2026,VA,75%,Likely,SenseFoundry
Order,FY26,FY26Q4,H2,Sunny ,"3 Custom Site  (深圳灣&港珠澳, 河套)-  C&ED HW 4",C&ED,Govt,Direct,SenseFoundry, 900 ,30-Jun-2026,VA,75%,Likely,SenseFoundry
Rev,FY26,FY26Q2,H1,Joey,"3 Custom Site  (深圳灣&港珠澳, 河套)-  C&ED PS - Ken",C&ED,Govt,Mircoware/Cornerstone,SenseFoundry, 900 ,30-Jun-2026,VA,75%,Likely,SenseFoundry
Order,FY27,FY26Q2,H1,Sunny ,Integrating Facial Recognition SDK into Firemen Tagging System,Hong Kong Fire Services Department,Govt,EBSL/Microware,Sensefoundry, 300 ,30-Jun-2026,VA,75%,Likely,SenseFoundry
Rev,FY26,FY26Q4,H2,Julian,Rocky Linux upgrade 70%,HKJC,Service Provider,HKT,Sensestudio , 770 ,30-Dec-2026,VA,50%,Likely,SenseStudio
Order,FY26,FY26Q2,H1,Joey,Ai Tool Box (HW),HKPF,Govt,CMHK,"SenseFoundry, Centurio"," 150,000 ",26-Jun-2026,VA&LLM,30%,Likely,SenseFoundry
Order,FY26,FY26Q2,H1,Joey,CSTCB Ai Cyber Security Lab,HKPF,Govt,HKPF,Sensepedia, 80 ,30-Jun-2026,LLM,75%,Likely,SensePedia
Rev,FY26,FY26Q3,H2,Julian,Legco VA 30%,Legco Department,Govt,HKT,SenseFoundry, 683 ,30-Sep-2026,VA,30%,Best,SenseFoundry
Rev,FY26,FY26Q1,H1,Sunny ,Eric Sir - LLM ,C&ED,Govt,Micoware/Netsurf,Sensepedia, 500 ,30-Mar-2026,VA,100%,Worst,SenseNova
Order,FY26,FY26Q3,H2,Sunny ,Postal Clearance System (PCS),C&ED,Govt,ASL ,SenseNova," 3,000 ",30-Jun-2026,VA&LLM,30%,Best,SenseNova
Rev,FY27,FY27Q4,H2,Joey,Ai Tool Box 2nd,HKPF,Govt,HKPF,"SenseFoundry, Centurio"," 50,000 ",26-Dec-2027,VA,50%,Likely,SenseFoundry
Rev,FY26,FY26Q2,H1,Julian,Rocky Linux upgrade 30%,HKJC,Service Provider,HKT,Sensestudio , 330 ,30-Jun-2026,VA,50%,Likely,SenseStudio
Rev,FY24,FY24Q4,H2,Joey,PF CSTCB LLM (Software PO1 & Services PO2),HKPF,Govt,HKPF,SenseNova," 2,045 ",26-Dec-2024,LLM,100%,Worst,SenseNova
Order,FY24,FY24Q3,H2,Joey,EVI Access Control - Jul 2024,EVI ,Education,EVI,Sensepass, 40 ,20-Sep-2024,Won,100%,Worst,SenseStudio & Spring
Rev,FY25,FY25Q2,H1,Julian,AAHK - T1 FR People Tracking System (part 2b) - Prof Services,HK Airport,Transportation,GW,Xperience," 2,615 ",30-Sep-2025,VA,100%,Worst,Xperience
Rev,FY26,FY26Q2,H1,Julian,ACS -Extension 7x24 (2nd yr),HK Airport,Transportation,Chubb,SenseLink, 329 ,26-Jun-2026,VA,100%,Worst,SenseLink
Rev,FY27,FY27Q1,H1,Joey,Innocontent - ebook IP right with Ai portal - Phase 3,Innocontent,Govt,Innocontent,SenseNova," 5,000 ",30-Mar-2027,Key Deal,50%,Likely,SenseNova
Order,FY24,FY24Q4,H2,Joey,PF CSTCB LLM (PO3 HW),HKPF,Govt,HKPF,SenseNova," 2,200 ",26-Dec-2024,Key Deal,75%,Worst,SenseNova
Order,FY25,FY25Q2,H1,Julian,AAHK - T1 FR People Tracking System (part 2b) - Prof Services,HK Airport,Transportation,GW,Xperience," 2,500 ",30-Jun-2025,VA,100%,Worst,Xperience
Order,FY25,FY25Q4,H2,Joey,Nebula Edge Node,HKPF,Govt,HKPF,SenseFoundry, 120 ,30-Dec-2025,VA,100%,Worst,SenseFoundry
Rev,FY25,FY25Q4,H2,Joey,DH - POC_HPC ,DH,Govt,DH,SenseNova, 873 ,30-Nov-2025,LLM,100%,Worst,SenseNova
Order,FY26,FY26Q2,H1,Julian,Rocky Linux upgrade,HKJC,Service Provider,HKT,Sensestudio ," 1,100 ",30-Jun-2026,VA,50%,Best,SenseStudio
Order,FY25,FY25Q4,H2,Sunny ,DetentiionCenter - EMSD,ImmD,Govt, G-Matix / JEC,SenseStudio," 2,000 ",30-Nov-2025,VA,100%,Worst,SenseStudio & Spring
Rev,FY26,FY26Q1,H1,Julian,ACS -Extension 7x24 (2nd yr),HK Airport,Transportation,Chubb,SenseLink, 329 ,26-Mar-2026,VA,100%,Worst,SenseLink
Order,FY25,FY25Q3,H2,Julian,ACS Annual Main (4 yrs) 24 x7 upgrade,HK Airport,Transportation,Chubb,SenseLink," 2,125 ",30-Sep-2025,VA,100%,Worst,SenseLink
Rev,FY25,FY25Q4,H2,Sunny ,DetentionCenter - EMSD (Spec-in),ImmD,Govt,G-Matix / G4S,SenseStudio," 2,000 ",20-Dec-2025,VA,100%,Worst,SenseStudio & Spring
Order,FY24,FY24Q3,H2,Sunny ,EMSD LLM (800),EMSD,Govt,China Soft,SenseNova, 800 ,26-Sep-2024,Won,100%,Worst,SenseNova
Rev,FY24,FY24Q3,H2,Sunny ,EMSD LLM(30%),EMSD,Govt,China Soft,SenseNova, 681 ,26-Sep-2024,LLM,100%,Worst,SenseNova
Rev,FY25,FY25Q2,H1,Sunny ,Financial Secretary Office LLM,Financial Secretary,Govt,ASL ,SenseNova," 1,300 ",26-Jun-2025,LLM,100%,Worst,SenseNova
Order,FY25,FY25Q2,H1,Sunny ,Financial Secretary Office LLM,Financial Secretary,Govt,ASL ,SenseNova," 1,300 ",30-Jun-2025,LLM,100%,Worst,SenseNova
Rev,FY26,FY26Q3,H2,Julian,ACS -Extension 7x24 (2nd yr),HK Airport,Transportation,Chubb,SenseLink, 329 ,26-Sep-2026,VA,100%,Worst,SenseLink
Rev,FY26,FY26Q4,H2,Julian,ACS -Extension 7x24 (2nd yr),HK Airport,Transportation,Chubb,SenseLink, 329 ,26-Dec-2026,VA,100%,Worst,SenseLink
Rev,FY26,FY26Q2,H1,Joey,Facial Recognition SDK into Firemen Tagging System,Hong Kong Fire Services Department,Govt,EBSL,Sensefoundry, 340 ,30-Jun-2026,VA,75%,Likely,SenseFoundry
Order,FY24,FY24Q4,H2,Sunny ,HKland_VO_API,The Jardine Engineering Corporation Limited,Properties,The Jardine Engineering Corporation Limited,"SenseFoundry, Centurio", 100 ,26-Oct-2024,Potential Deal,100%,Worst,SenseNova
Rev,FY27,FY27Q2,H1,Joey,Popular consulting services - Tech & Doc ,Popular,publishing,GTI,SenseNova," 2,000 ",30-Jun-2027,LLM,30%,Best,SenseNova
Order,FY26,FY26Q2,H1,Julian,Legco VA,Legco Department,Govt,HKT,SenseFoundry," 2,500 ",30-Jun-2026,VA,50%,Best ,SenseFoundry
Rev,FY26,FY26Q2,H1,Joey,ECU Education Platform,ECU,Education,ECU,SenseEDU, 198 ,30-Jun-2026,EDU,100%,Worst,SenseEDU
Order,FY26,FY26Q4,H2,Sunny ,HKSI sport data AI,HKSI,Govt,PofficeAi,Sensecore," 10,000 ",30-Dec-2026,VA&LLM,30%,Best,Sensecore
Rev,FY25,FY25Q3,H2,Joey,PF FY25-26 350+72 Cams Main,HKPF,Govt,HKPF,SenseFoundry," 1,112 ",26-Sep-2025,VA,100%,Worst,SenseFoundry
Order,FY26,FY26Q2,H1,Julian,OXO AIDC consultancy,OXO,Service Provider,Eagletrend,Sensecore," 10,000 ",30-Jun-2026,VA&LLM,50%,Likely,SenseNova
Rev,FY26,FY26Q3,H2,Joey,ECU Education Platform,ECU,Education,ECU,SenseEDU, 240 ,30-Sep-2026,EDU,30%,Best,SenseEDU
Rev,FY26,FY26Q4,H2,Joey,ECU Education Platform,ECU,Education,ECU,SenseEDU, 240 ,30-Dec-2026,EDU,30%,Best,SenseEDU
Rev,FY26,FY26Q2,H1,Joey,PF TSD Offline Foundary 2026 main,HKPF,Govt,HKPF,SenseFoundry, 221 ,30-Jun-2026,VA,75%,Worst,SenseFoundry
Rev,FY26,FY26Q3,H2,Joey,PF TSD Offline Foundary 2026 main,HKPF,Govt,HKPF,SenseFoundry, 221 ,26-Sep-2026,VA,100%,Worst,SenseFoundry
Order,FY27,FY27Q3,H2,Julian,"OXO AIDC L2-L3 HW, SW, Services",OXO,Service Provider,Eagletrend,Sensecore," 40,000 ",30-Sep-2027,VA&LLM,30%,Best,Sensecore
Rev,FY28,FY28Q2,H1,Julian,"OXO AIDC L2-L3 HW, SW, Services",OXO,Service Provider,Eagletrend,Sensecore," 40,000 ",30-Sep-2027,VA&LLM,30%,Best,Sensecore
Order,FY29,FY29Q3,H2,Julian,"OXO AIDC L3 HW, SW, Services",OXO,Service Provider,Eagletrend,Sensecore," 40,000 ",30-Sep-2029,VA&LLM,30%,Best,Sensecore
Rev,FY30,FY30Q2,H1,Julian,"OXO AIDC L3 HW, SW, Services",OXO,Service Provider,Eagletrend,Sensecore," 40,000 ",30-Sep-2030,VA&LLM,30%,Best,Sensecore
Rev,FY26,FY26Q4,H2,Joey,PF TSD Offline Foundary 2026 main,HKPF,Govt,HKPF,SenseFoundry, 221 ,30-Dec-2026,VA,100%,Worst,SenseFoundry
Rev,FY26,FY26Q2,H1,Julian,HKJC CTA annual maintenance 2025-2026,HKJC,Service Provider,HKT,SenseInsight, 158 ,30-Jun-2026,VA,100%,Worst,SenseInsight
Order,FY26,FY26Q3,H2,Joey,Innocontent - ebook IP right with Ai portal Phase 2,Innocontent,Govt,Loyalmaster,SenseNova," 4,500 ",30-Sep-2026,LLM,50%,Best,SenseNova
Order,FY27,FY27Q2,H1,Joey,Innocontent - ebook IP right with Ai portal Phase 3,Innocontent,Govt,Loyalmaster,SenseNova," 3,000 ",30-Jun-2027,LLM,50%,Likely,SenseNova
Rev,FY25,FY25Q4,H2,Julian,MTR Phase 2 - addon 4 algo,MTR,Transportation,GTI,"SenseStudio, SenseSpring", 600 ,31-Dec-2025,VA,100%,Worst,SenseStudio & Spring
Rev,FY25,FY25Q1,H1,Joey,PF FY25-26 350+72 Cams Main,HKPF,Govt,HKPF,SenseFoundry," 1,012 ",26-Mar-2025,VA,100%,Worst,SenseFoundry
Rev,FY25,FY25Q2,H1,Joey,PF FY25-26 350+72 Cams Main,HKPF,Govt,HKPF,SenseFoundry," 1,012 ",26-Jun-2025,VA,100%,Worst,SenseFoundry
Rev,FY25,FY25Q3,H2,Joey,"Innocontent - ebook IP right with Ai portal - Phase 1, Part 1&2",Innocontent,Govt,Loyalmaster,SenseNova," 3,800 ",30-Sep-2025,LLM,100%,Worst,SenseNova
Order,FY25,FY25Q2,H1,Joey,DH - POC_HPC ,DH,Govt,DH,SenseNova," 1,000 ",30-Jun-2025,LLM,100%,Worst,SenseNova
Rev,FY26,FY26Q1,H1,Julian,HKJC CTA annual maintenance 2025-2026,HKJC,Service Provider,HKT,SenseInsight, 158 ,30-Mar-2026,VA,100%,Worst,SenseInsight
Rev,FY25,FY25Q4,H2,Julian,ACS Annual Main (1st yrs),HK Airport,Transportation,CHUBB,SenseLink, 350 ,26-Dec-2025,VA,100%,Worst,SenseLink
Rev,FY24,FY24Q4,H2,Joey,PF CSTCB LLM (HW PO3),HKPF,Govt,HKPF,SenseNova," 2,200 ",26-Dec-2024,LLM,100%,Worst,SenseNova
Rev,FY24,FY24Q4,H2,Sunny ,HKland_VO_API,The Jardine Engineering Corporation Limited,Properties,JEC - account unlock.,SenseSudio, 248 ,26-Dec-2024,VA,100%,Worst,SenseNova
Order,FY24,FY24Q1,H1,Sunny ,C&ED_LLM POC,C&ED,Govt,Miroware,SenseChat, 200 ,26-Mar-2024,Won,100%,Worst,SenseNova
Order,FY24,FY24Q4,H2,Julian,AAHK - T1 FR People Tracking System (part 2a),HK Airport,Transportation,GW,Xperience," 2,000 ",30-Oct-2024,Won,100%,Worst,Xperience
Rev,FY24,FY24Q4,H2,Sunny ,C&ED_LLM POC,C&ED,Govt,Miroware,SenseChat, 50 ,31-Dec-2024,LLM,100%,Worst,SenseNova
Order,FY24,FY24Q2,H1,Sunny ,C&ED_LLM POC,C&ED,Govt,GW ,SenseNova, 50 ,26-Jun-2024,Key Deal,100%,Worst,SenseNova
Order,FY24,FY24Q2,H1,Sunny ,C&ED_AR,C&ED,Govt,GW ,"SenseAvatar, SenseChat", 373 ,26-Jun-2024,Won,100%,Worst,SenseNova
Order,FY24,FY24Q1,H1,Julian,CLP CPE phase 2,CLP,Utilities,GW,SenseStudio, 344 ,26-Mar-2024,Won,100%,Worst,SenseStudio & Spring
Order,FY24,FY24Q4,H2,Sunny ,EMSD LLM (1700),EMSD,Govt,China Soft,SenseNova," 1,700 ",26-Nov-2024,Won,100%,Worst,SenseNova
Order,FY24,FY24Q2,H1,Julian,Escalator Safety phase 1,MTR,Transportation,GTI,"SenseStudio, SenseSpring", 277 ,26-Jun-2024,Won,100%,Worst,SenseStudio & Spring
Rev,FY27,FY27Q4,H2,Julian,Sensecare - EduHK,EduHK,Govt,EduHK,SenseNova," 9,000 ",26-Dec-2027,LLM,30%,Best,SenseNova
Order,FY27,FY27Q2,H1,Julian,"OXO AIDC L2-L3 HW, SW, Services",OXO,Service Provider,Eagletrend,Sensecore," 60,000 ",30-Jun-2027,VA&LLM,30%,Best,SenseNova
Order,FY27,FY27Q2,H1,Julian,SanTin AIDC,HKSTP,Service Provider,HKSTP,Sensecore," 1,000 ",30-Jun-2027,VA&LLM,30%,Best,SenseNova
Order,FY26,FY26Q1,H1,Joey,PF TSD Offline Foundary 2026 main,HKPF,Govt,HKPF,SenseFoundry, 800 ,26-Feb-2026,VA,50%,Best,SenseFoundry
Rev,FY26,FY26Q3,H2,Julian,HKJC CTA annual maintenance 2025-2026,HKJC,Service Provider,HKT,SenseInsight, 158 ,30-Sep-2026,VA,100%,Worst,SenseInsight
Order,FY25,FY25Q3,H2,Julian,HKJC CTA annual maintenance 2025-2026,HKJC,Service Provider,HKT,SenseInsight, 600 ,30-Sep-2025,VA,100%,Worst,SenseInsight
Order,FY25,FY25Q3,H2,Julian,MTR Phase 2 add-on,MTR,Transportation,GTI,"SenseStudio, SenseSpring", 600 ,26-Sep-2025,VA,100%,Worst,SenseStudio & Spring
Rev,FY25,FY25Q4,H2,Macau,公职局续约,Macau公职局,Govt,NetCraft,SSID, 317 ,31-Dec-2025,SSID,100%,Worst,SSID
Rev,FY24,FY24Q2,H1,Joey,PF TSD 350 Cameras & 72 Cameras Test Bed,HKPF,Govt,HKPF,"SenseFoundry, Centurio", 814 ,26-Jun-2024,VA,100%,Worst,SenseEDU
Rev,FY24,FY24Q2,H1,Julian,AAHK - T1 FR,HK Airport,Transportation,GW,Xperience," 5,194 ",30-Jun-2024,VA,100%,Worst,Xperience
Rev,FY24,FY24Q2,H1,Sunny ,C&ED_Baggage Identification and Tracking System,C&ED,Govt,GW/LPS,Xperience," 2,500 ",30-Jun-2024,VA,100%,Worst,Xperience
Rev,FY24,FY24Q1,H1,Sunny ,GW_ Testing Site Set Up,C&ED,Govt,GW,Xperience, 89 ,31-Mar-2024,VA,100%,Worst,Xperience
Order,FY24,FY24Q1,H1,Sunny ,Atech_maintenance_ SenseUnity,C&ED,Govt,Atech,SenseUnity, 82 ,31-Mar-2024,Won,100%,Worst,SenseStudio & Spring
Rev,FY24,FY24Q1,H1,Julian,SHK PC Mall After-Sales Consultancy Serv,SHK,Enterprise ,GW,Senseinsight, 165 ,31-Mar-2024,VA,100%,Worst,Xperience
Rev,FY24,FY24Q1,H1,Sunny ,Atech_maintenance_ SenseUnity,C&ED,Govt,Atech,SenseUnity, 7 ,31-Mar-2024,VA,100%,Worst,SenseStudio & Spring
Rev,FY24,FY24Q1,H1,Julian,GW_New Branch_ Smart Camera,HKJC,Enterprise ,GW,Senseinsight, 243 ,31-Mar-2024,VA,100%,Worst,SenseInsight
Rev,FY24,FY24Q1,H1,Julian,Hong Kong Airport ACS project - Change R,HK Airport,Govt,GW,SenseStudio, 72 ,31-Mar-2024,VA,100%,Worst,SenseStudio & Spring
Rev,FY24,FY24Q1,H1,Sunny ,GW_Replenishment order,C&ED,Govt,GW,SensePass, 1 ,31-Mar-2024,VA,100%,Worst,SenseStudio & Spring
Rev,FY25,FY25Q4,H2,JUDGED,Other small deals,Other,Other,Other,Other,-329 ,30-Sep-2025,VA&LLM,100%,Worst,SenseFoundry
Rev,FY25,FY25Q3,H2,JUDGED,Other small deals,Other,Other,Other,Other, 67 ,30-Sep-2025,VA&LLM,100%,Worst,SenseFoundry`;

export const parseSalesData = (): SalesRecord[] => {
  const lines = rawData.split('\n');
  const headers = lines[0].split(',');
  
  const records = lines.slice(1).map((line, idx) => {
    // Handle CSV with possible quoted fields containing commas (like " 5,220 ")
    const matches = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=^)(?=,)|(?<=,)(?=$))/g);
    if (!matches) return null;
    
    const fields = matches.map(f => f.replace(/"/g, '').trim());
    
    // Total Amount: " 5,220 " -> 5220
    const amountStr = fields[10]?.replace(/,/g, '') || '0';
    const amountK = parseFloat(amountStr) || 0;
    
    // Win Rate: "100%" -> 1.0
    const winRateStr = fields[13]?.replace('%', '') || '0';
    const winRate = (parseFloat(winRateStr) || 0) / 100;

    return {
      id: `initial-${idx + 1}`,
      category: fields[0],
      fy: fields[1],
      fyQtr: fields[2],
      half: fields[3],
      salesPerson: fields[4],
      itemName: fields[5],
      customerName: fields[6],
      sector: fields[7],
      partners: fields[8],
      productType: fields[9],
      amountK,
      date: fields[11],
      winRate,
      status: fields[14],
      productType2: fields[15]
    };
  }).filter(r => r !== null) as SalesRecord[];

  // Deduplicate based on ID
  const seenIds = new Set<string>();
  return records.filter(r => {
    if (seenIds.has(r.id)) {
      return false;
    }
    seenIds.add(r.id);
    return true;
  });
};
