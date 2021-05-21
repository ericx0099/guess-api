const Question = require("../../models/question");
const User = require("../../models/user");
const Country = require("../../models/country");
const { transformQuestion } = require("./merge");

module.exports = {
    questions: async () => {
        try{
            const questions = await Question.find();
            return questions.map((question) => {
                return transformQuestion(question);
            })
        }catch(err){
            throw err;
        }
    },
    question: async ({_id}) => {
        try{
            const questionFound = Question.findById(_id);
            return transformQuestion(questionFound);
        }catch(err){
            throw err;
        }
    },
    createQuestion: async (args, req) => {
        if (!req.isAuth) {
            throw new Error("Unauthenticated");
        }
        try{
            const answer = await Country.findById(args.questionInput.answer);
            const creator = await User.findById(req.userId);
            const newQuestion = new Question({
                creator: creator,
                answer: answer,
                image_url: args.questionInput.image_url,
                text: args.questionInput.text
            });
            const result = await newQuestion.save();

            creator.questions.push(result);
            await creator.save();

            return transformQuestion(result);
        }catch(err){
            throw err;
        }

    }
}
