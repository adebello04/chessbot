const chess = require('chess')

const { board } = require('@/keyboards')
const { debug, unescapeUser } = require('@/helpers')

module.exports = () => [
  /^join::([wb])::(\d+)/,
  async (ctx) => {
    debug(ctx.update)
    const enemyId = Number(ctx.match[2])
    const iAmWhite = ctx.match[1] !== 'w'

    if (ctx.from.id === enemyId) {
      return ctx.answerCbQuery('You can\'t join yourself!')
    }

    let enemy = await ctx.db('users').where('id', enemyId).first().catch(debug)

    if (enemy) {
      enemy = unescapeUser(enemy)
    }

    const [gameId] = await ctx.db('games').returning('id').insert({
      whites_id: iAmWhite ? ctx.from.id : enemy.id,
      blacks_id: iAmWhite ? enemy.id : ctx.from.id,
      inline_id: ctx.callbackQuery.inline_message_id,
    }).catch(debug)

    ctx.game.id = gameId
    ctx.game.inlineId = ctx.callbackQuery.inline_message_id

    const gameClient = chess.create({ PGN: true })
    const status = gameClient.getStatus()

    await ctx.editMessageText(
      iAmWhite
        ? `Black (top): ${enemy.first_name}
White (bottom): ${ctx.from.first_name}
White's turn`
        : `Black (top): ${ctx.from.first_name}
White (bottom): ${enemy.first_name}
White's turn`,
      board(status.board.squares, true)
    )

    return ctx.answerCbQuery('Now play!')
  },
]
