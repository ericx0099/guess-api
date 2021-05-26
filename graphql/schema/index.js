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
            answers: [Answer!]!
            isAdmin: Boolean!
            createdAt: String!
            updatedAt: String!
        }
        
        type Answer {
            _id: ID!
            answer: Country!
            question: Question!
            game: Game!
            user: User!
            points: Int!
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
        
        type newQuestion {
            question_text: String!
            question_id: ID!
            countries: [Country!]!
            players : [User]!
            game_round: Int!
        }
        input GameInput{
            uniq_token: String!
        }
        input CountryInput {
            name: String!
        }
        
        input AnswerInput {
            answer: String!
            question: String!,
            user: String!
            game: String!
            points: Int!
        }
  
        input UserInput{
            email: String!
            password: String!
            username: String!
            isAdmin: Boolean!
        }
    
        input QuestionInput{
            answer: String!
            image_url: String
            text: String!
        }
      
        type RootQuery{
            games: [Game!]! 
            login(email: String!, password: String!): AuthData!
            countries: [Country!]!
            country(_id:String): Country!
            questions: [Question!]!
            question(_id: String): Question!
            answers: [Answer!]!
            answer(_id:String): Answer!
            game(_id: String): Game!
            user(_id:String): User!
            me: User!
            gameByToken(token: String!): Game!
            joinGame(user_id: String!, game_token: String!): Game!
            users: [User!]!
            canStart(user_id: String!, game_token: String!): Boolean!
            getQuestion(game_token: String!): newQuestion!
        }
        
        type RootMutation{
            createGame: Game
            createUser(userInput: UserInput): User
            createCountry(countryInput: CountryInput): Country
            createQuestion(questionInput: QuestionInput): Question
            createAnswer(answerInput: AnswerInput): Answer
        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `);
