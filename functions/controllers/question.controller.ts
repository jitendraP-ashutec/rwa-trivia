import { ESUtils } from '../utils/ESUtils';
import {
    SearchCriteria, Game, PlayerQnA, Question,
    PlayerMode, QuestionStatus, interceptorConstants, ResponseMessagesConstants, CollectionConstants, QuestionsConstants, HeaderConstants
} from '../../projects/shared-library/src/lib/shared/model';
import { GameMechanics } from '../utils/game-mechanics';
import { Utils } from '../utils/utils';
import { QuestionService } from '../services/question.service';
import { GameService } from '../services/game.service';
import { QuestionBifurcation } from '../utils/question-bifurcation';

export class QuestionController {

    /**
     * getQuestionOfDay
     * return question of the day
     */
    static async getQuestionOfDay(req, res): Promise<any> {
        try {
            const isNextQuestion = (req.params.nextQ && req.params.nextQ === QuestionsConstants.NEXT) ? true : false;
            Utils.sendResponse(res, interceptorConstants.SUCCESS, await ESUtils.getRandomQuestionOfTheDay(isNextQuestion));
        } catch (error) {
            Utils.sendError(res, error);
        }
    }

    /**
     * getQuestions
     * return questions
     */
    static async getQuestions(req, res): Promise<any> {
        try {
            // Admins can get all Qs, while authorized users can only get Qs created by them
            // TODO: For now restricting it to admins only till we add security
            const start = req.params.start;
            const size = req.params.size;
            const criteria: SearchCriteria = req.body;
            console.log(criteria);
            Utils.sendResponse(res, interceptorConstants.SUCCESS, await ESUtils.getQuestions(start, size, criteria));
        } catch (error) {
            Utils.sendError(res, error);
        }
    }


    /**
     * getNextQuestion
     * return question
     */
    static async getNextQuestion(req, res): Promise<any> {

        try {
            const userId = req.user.uid;
            const gameId = req.params.gameId;
            const g = await GameService.getGameById(gameId);

            if (!g) {
                // game not found
                Utils.sendResponse(res, interceptorConstants.FORBIDDEN, ResponseMessagesConstants.GAME_NOT_FOUND);
            }

            const game: Game = g;
            // console.log(game);

            if (game.playerIds.indexOf(userId) < 0) {
                // user not part of this game
                Utils.sendResponse(res, interceptorConstants.FORBIDDEN, ResponseMessagesConstants.USER_NOT_PART_OF_GAME);
            }

            if (game.gameOver) {
                // gameOver
                Utils.sendResponse(res, interceptorConstants.FORBIDDEN, ResponseMessagesConstants.GAME_OVER);
            }

            if (game.gameOptions.gameMode !== 0) {
                // Multiplayer mode - check whose turn it is. Not yet implemented
                Utils.sendResponse(res, interceptorConstants.FORBIDDEN, ResponseMessagesConstants.WAIT_FOR_YOUR_TURN);
            }

            const status = await GameMechanics.changeTheTurn(game);
            if (status) {
                const questionIds = [];
                for (const questionObj of game.playerQnAs) {
                    questionIds.push(questionObj.questionId);
                }
                const question = await ESUtils.getRandomGameQuestion(game.gameOptions.categoryIds, questionIds);
                const createdOn = Utils.getUTCTimeStamp();
                const playerQnA: PlayerQnA = {
                    playerId: userId,
                    questionId: question.id,
                    addedOn: createdOn,
                };

                if (game.playerQnAs.length > 0) {
                    if (Number(game.gameOptions.playerMode) === PlayerMode.Single) {
                        game.round = game.round + 1;
                    }
                }

                playerQnA.round = game.round;
                question.gameRound = game.round;
                question.addedOn = createdOn;
                question.serverTimeQCreated = createdOn;
                game.playerQnAs.push(playerQnA);
                const dbGame = game.getDbModel();
                await GameService.updateGame(dbGame);
                Utils.sendResponse(res, interceptorConstants.SUCCESS, question);
            } else {
                const newQuestion = await ESUtils.getQuestionById(game.playerQnAs[game.playerQnAs.length - 1].questionId);
                newQuestion.gameRound = game.round;
                const createdOn = Utils.getUTCTimeStamp();
                newQuestion.serverTimeQCreated = createdOn;
                Utils.sendResponse(res, interceptorConstants.SUCCESS, newQuestion);
            }
        } catch (error) {
            Utils.sendError(res, error);
        }
    }

    /**
     * getUpdatedQuestion
     * return question
     */
    static async getUpdatedQuestion(req, res): Promise<any> {

        try {
            const questionId = req.params.questionId;
            const playerQnA = req.body.playerQnA;
            if (!questionId) {
                Utils.sendResponse(res, interceptorConstants.BAD_REQUEST, ResponseMessagesConstants.QUESTION_ID_IS_NOT_AVAILABLE);
            }
            const question: Question = await QuestionService.getQuestionById(questionId);
            if (playerQnA.playerAnswerId && playerQnA.playerAnswerId !== null) {
                const answerObj = question.answers[playerQnA.playerAnswerId];
                question.userGivenAnswer = answerObj.answerText;
            } else {
                question.userGivenAnswer = null;
            }
            Utils.sendResponse(res, interceptorConstants.SUCCESS, question);
        } catch (error) {
            Utils.sendError(res, error);
        }
    }


    /**
     * changeUnpublishedQuestionStatus
     * return status
     */
    static async changeUnpublishedQuestionStatus(req, res): Promise<any> {

        try {
            const questions: Question[] = await QuestionService.getQuestion(CollectionConstants.UNPUBLISHED_QUESTIONS);
            const questionUpdatePromises = [];
            for (const questionObj of questions) {
                if (questionObj.status === QuestionStatus.SUBMITTED) {
                    questionObj.status = QuestionStatus.PENDING;
                    const dbQuestion = { ...questionObj };
                    questionUpdatePromises.push(QuestionService.updateQuestion(CollectionConstants.UNPUBLISHED_QUESTIONS, dbQuestion));
                }
            }
            await Promise.all(questionUpdatePromises);
            Utils.sendResponse(res, interceptorConstants.SUCCESS, ResponseMessagesConstants.UNPUBLISHED_STATUS_CHANGED);
        } catch (error) {
            Utils.sendError(res, error);
        }
    }


    /**
     * getUserImages
     * return user
     */
    static async getQuestionImages(req, res) {
        const questionId = req.params.questionId;
        const userId = req.params.userId;
        const questionImage = req.params.imageName;
        if (!userId) {
            // userId is not available
            Utils.sendResponse(res, interceptorConstants.BAD_REQUEST, ResponseMessagesConstants.USER_ID_NOT_FOUND);
        }
        if (!questionId) {
            // questionId is not available
            Utils.sendResponse(res, interceptorConstants.BAD_REQUEST, ResponseMessagesConstants.QUESTION_ID_NOT_FOUND);
        }

        if (!questionImage) {
            // questionImage is not available
            Utils.sendResponse(res, interceptorConstants.BAD_REQUEST, ResponseMessagesConstants.QUESTION_IMAGE_NAME_NOT_FOUND);
        }

        try {
            const stream = await QuestionService.generateQuestionImage(userId, questionImage, questionId);
            res.setHeader(HeaderConstants.CONTENT_DASH_DISPOSITION,
                HeaderConstants.ATTACHMENT_SEMI_COLON_FILE_NAME_EQUAL_TO_QUESTION_UNDER_SCORE_IMAGE_DOT_PNG);
            res.setHeader(HeaderConstants.CONTENT_DASH_TYPE, HeaderConstants.IMAGE_FORWARD_SLASH_JPEG);
            Utils.sendResponse(res, interceptorConstants.SUCCESS, stream);
        } catch (error) {
            Utils.sendError(res, error);
        }

    }

        /**
     * generateUserProfileImage
     * return status
     */
    static async uploadQuestionImage(req, res) {
        if (req.body.questionImage.created_uid !== req.user.uid) {
            Utils.sendResponse(res, interceptorConstants.UNAUTHORIZED, ResponseMessagesConstants.UNAUTHORIZED);
        }

        let question = req.body.questionImage;
        question.userId = req.user.uid;
        question.id = req.params.questionId;
        try {
            if (question.questionImage && question.croppedImageUrl && question.originalImageUrl) {

                question = await QuestionBifurcation.uploadQuestionImage(question);

            }

            Utils.sendResponse(res, interceptorConstants.SUCCESS, { 'status': ResponseMessagesConstants.QUESTION_IMAGE_SAVED });

        } catch (error) {
            Utils.sendError(res, error);
        }
    }

}
