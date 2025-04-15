Tokenentry - NFT Event Ticketing System 
Problem Definition
The event ticketing industry right now has lots of problems that affect both regular people and the organizers who put on these events. We have identified these major issues:
Issues from user perspective
People buy loads of tickets right when they go on sale and resell them for way higher prices, which makes going to events too expensive for normal fans. Fake tickets are everywhere, and buyers don't have any good way to check if tickets are real before they pay. When you buy from resellers, you can't see where the ticket came from or if it's authentic. Once u buy a ticket, u don't have many options if u cant go anymore.
Issues from Business/Organizer perspective:
When tickets get resold, organizers don't get any money from these secondary sales. It's almost impossible to stop scalpers from charging crazy high prices. Companies waste so much time and resources fighting fake tickets and dealing with scammed customers. When tickets change hands unofficially, organizers lose info about who's actually at their events.
We've personally seen this happen at concerts where tickets sell out in like 30 seconds, and then immediately show up on StubHub for 3-4 times the price. It's super frustrating for real fans and event organizers, and creates a terrible experience for everyone except the scalpers who make all the profit. Like last month we tried to get tickets to see our fav band and they were gone instantly, then we checked resale sites and they were asking $300 for tickets that were originally $75! The whole system is broken and needs fixing asap.

Why blockchain could be useful to solve this issue
We chose blockchain technology for this problem because NFTs provide a way to create tickets that cannot be counterfeited because each one is verified on the blockchain. The public ledger keeps track of all ticket transfers, so anyone can see who owned a ticket before and verify its authenticity. We can program rules directly into the tickets, like putting a cap on resale prices or making sure organizers get a cut of resales.
The system isn't controlled by one company that could change the rules whenever they want. Event organizers automatically get a percentage when tickets are resold, which creates a new way for them to make money. Traditional ticketing systems like Ticketmaster cannot offer the same transparency, they cannot guarantee royalties to event organizers, and they don't have the same programmable features that blockchain provides. Even with anti-scalping measures, centralized platforms still have problems with fake tickets and don't provide complete ownership history.


Contract Design and Architecture
Contracts
Our system will use three main contracts:
1. TokenEntryTicket.sol
contract for creating events and minting ticket NFTs. it uses OpenZeppelin's ERC721 for NFT functionality and  it handles event creation, ticket purchases, and validation
2. TokenEntryMarketplace.sol 
The secondary market contract for reselling tickets. it manages listings, purchases, and royalty distribution and it enforces price caps to prevent scalping
3. TokenEntryRoles.sol
Manages access control for the system. It defines roles like admin, event manager, and validator and it inherits from OpenZeppelin's AccessControl


Front-End Application
We also plan to add a react based frontend which will have these pages
User
listing of upcoming events with basic details
View bought tickets and generate QR codes for entry
Buy and sell tickets
Admin
Simple form to create new events
Activate/deactivate events and validate tickets

Conclusion
Our tokenentry system fixes event ticketing problems with blockchain and NFTs. Fans get real tickets that can't be faked and fair prices. Organizers get money from resales, less fraud and better attendance data. The market gets more transparency and fairness. This system makes ticket buying and selling better for everyone. Blockchain is perfect because it solves verification problems, ownership tracking and creates sales rules nobody can bypass. Our implementation is solid and can add more features later like dynamic pricing or ticket bundles. The contracts would work well on layer-2 to make transactions cheaper.

