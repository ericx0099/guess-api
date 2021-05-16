const { buildSchema } = require("graphql");

module.exports = buildSchema(`
        type Game {
            _id: ID!
            uniq_token: String!
            creation_date: String!
            users: [User!]
            creator: User!
            answers: [Answer!]
            questions: [Question!]
            createdAt: String!
            updatedAt: String!
        }
        
        type User {
            _id: ID!
            email: String!
            username: String!
            password: String
            points: Int!
            country: Country!
            games: [Game!]
            questions: [Question!]
        }
        
        type Answer {
            _id: ID!
            answer: Country!
            question: Question!
            game: Game!
            user: User!
        }
        
        type Country {
            _id: ID!
            name: String!
            users: [User!]
        }
        
        type Question {
            _id: ID!
            image_url: String!
            text: String!
            answer: Country!
        }
        
        type AuthData {
            userId: ID!
            token: String!
            tokenExpiration: Int!
        }
    
        input GameInput{
            uniq_token: String!
        }
        input CountryInput {
            name: String!
        }
        
        input UserInput{
            email: String!
            password: String!
            username: String!
        }
        
        input AnswerInput{
            user_id: Int!
        }
        type RootQuery{
            games: [Game!]!
            login(email: String!, password: String!): AuthData!
        }
        
        type RootMutation{
            createGame(gameInput: GameInput): Game
            createUser(userInput: UserInput): User
            createCountry(countryInput: CountryInput): Country
        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `);
