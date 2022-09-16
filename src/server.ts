import express from "express";
import cors from "cors";

import { PrismaClient } from "@prisma/client";
import { convertHourStringToMinutes } from "./utils/hours-string-to-minutes-converter";
import { converterMinutesToHoursString } from "./utils/minutes-to-hour-string-converter";

const app = express()
app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
    log: ['query']
})

app.get('/games', async (req, res) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true
                }
            }
        }
    })

    return res.status(200).json(games)
})

app.get('/games/:id/ads', async(req, res) => {
    const gameId = req.params.id
    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
        },
        where: {
            gameId: gameId
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return res.status(200).send(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: converterMinutesToHoursString(ad.hourStart),
            hourEnd: converterMinutesToHoursString(ad.hourEnd)
        }
    }))
})

app.post('/games/:id/ads', async(req, res) => {
    const gameId = req.params.id
    const body = req.body

    const ad = await prisma.ad.create({
        data: {
            name:            body.name,
            gameId:          gameId,
            yearsPlaying:    body.yearsPlaying,
            discord:         body.discord,
            weekDays:        body.weekDays.join(','),
            hourStart:       convertHourStringToMinutes(body.hourStart),
            hourEnd:         convertHourStringToMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel,
        }
    })

    return res.status(201).json(ad)
})

app.get('/ads', (req, res) => {
    return res.status(200).json([
        {id: 1, name: 'Anúncio 1'},
        {id: 2, name: 'Anúncio 2'},
        {id: 3, name: 'Anúncio 3'},
    ])
})

app.get('/ads/:id/discord', async(req, res) => {
    const adId = req.params.id

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId
        }
    })
    return res.status(200).send({
        discord: ad.discord
    })
})

app.listen(3333)