const Answer = require("../../models/answer");
const Country = require("../../models/country");
const User = require('../../models/user');
const Question = require('../../models/question');
const Game = require('../../models/game');
const { transformAnswer } = require("./merge");
module.exports = {
    answers: async () => {
        const answers = await Answer.find();
        return answers.map((answer) => {
            return transformAnswer(answer);
        });
    },
    answer: async ({_id}) => {
        try{
            const answerFound = await Answer.findById(_id);
            return transformAnswer(answerFound);
        }catch(err){
            throw err;
        }
    },
    createAnswer: async (args, req) =>  {
     /*   if(!req.isAuth){
            throw new Error("Unauthenticated");
        }*/
        let createdAnswer;
        try{
            const user = await User.findById(args.answerInput.user);
            const question = await Question.findById(args.answerInput.question);
            const answer = await Country.findById(args.answerInput.answer);
            var game = await Game.findOne({uniq_token:args.answerInput.game });
            console.log("pointssss=>"+args.answerInput.points);
            const new_answer = new Answer({
                answer: answer,
                question: question,
                game: game,
                user: user,
                points: args.answerInput.points
            });

            const result = await new_answer.save();
            createdAnswer = transformAnswer(result);
            game.answers.push(result);
            user.answers.push(result);
            await user.save();
            await game.save();
            return createdAnswer;
        }catch (err){
            throw err;
        }
    }
}
