import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { TournamentMatch } from '../../tournament.models';

type BracketRound = { round: number; matches: TournamentMatch[] };
type BracketLayout = {
  rounds: Array<{ round: number; x: number; matches: Array<{ match: TournamentMatch; y: number }> }>;
  connectors: string[];
  width: number;
  height: number;
};

const bracketCardHeight = 110;
const bracketCardWidth = 240;
const bracketFirstRoundGap = 56;
const bracketColumnGap = 40;
const bracketHeaderHeight = 28;
const bracketSlotStep = bracketCardHeight + bracketFirstRoundGap;

@Component({
  selector: 'app-tournament-bracket',
  imports: [DatePipe, RouterLink],
  templateUrl: './tournament-bracket.html',
  styleUrl: './tournament-bracket.scss',
})
export class TournamentBracket {
  readonly matches = input.required<TournamentMatch[]>();

  protected teamName(team: TournamentMatch['teamA']): string {
    return team?.name ?? 'TBD';
  }

  protected bracketLayout(matches: TournamentMatch[]): BracketLayout {
    const rounds = this.bracketRounds(matches).map(({ round, matches: roundMatches }) => ({
      round,
      x: (round - 1) * (bracketCardWidth + bracketColumnGap),
      matches: roundMatches.map((match) => ({
        match,
        y: this.bracketMatchY(round, match.bracketPosition),
      })),
    }));
    const cards = new Map<string, { x: number; y: number }>();

    for (const round of rounds) {
      for (const card of round.matches) {
        cards.set(`${round.round}:${card.match.bracketPosition}`, { x: round.x, y: card.y });
      }
    }

    for (const round of rounds) {
      for (const card of round.matches) {
        const target = card.match.nextRound && card.match.nextBracketPosition
          ? cards.get(`${card.match.nextRound}:${card.match.nextBracketPosition}`)
          : null;

        if (!target || !card.match.nextMatchSlot) {
          continue;
        }

        const direction = card.match.nextMatchSlot === 'TEAM_A' ? -1 : 1;
        card.y = target.y + (bracketCardHeight / 2) + (direction * this.bracketBranchOffset(card.match.round)) - (bracketCardHeight / 2);
      }
    }

    cards.clear();
    for (const round of rounds) {
      for (const card of round.matches) {
        cards.set(`${round.round}:${card.match.bracketPosition}`, { x: round.x, y: card.y });
      }
    }

    const connectors = matches
      .map((match) => this.bracketConnector(match, cards))
      .filter((path): path is string => Boolean(path));
    const width = Math.max(...rounds.map((round) => round.x + bracketCardWidth), bracketCardWidth);
    const height = Math.max(
      ...rounds.flatMap((round) => round.matches.map((card) => card.y + bracketCardHeight)),
      bracketCardHeight,
    );

    return { rounds, connectors, width, height };
  }

  private bracketRounds(matches: TournamentMatch[]): BracketRound[] {
    const rounds = new Map<number, TournamentMatch[]>();

    for (const match of matches) {
      rounds.set(match.round, [...(rounds.get(match.round) ?? []), match]);
    }

    return [...rounds.entries()]
      .sort(([firstRound], [secondRound]) => firstRound - secondRound)
      .map(([round, roundMatches]) => ({
        round,
        matches: roundMatches.sort((first, second) => first.bracketPosition - second.bracketPosition),
      }));
  }

  private bracketMatchY(round: number, bracketPosition: number): number {
    const roundSpan = 2 ** (round - 1);
    const slotIndex = (bracketPosition - 1) * roundSpan + ((roundSpan - 1) / 2);

    return bracketHeaderHeight + (slotIndex * bracketSlotStep);
  }

  private bracketBranchOffset(round: number): number {
    return (2 ** (round - 1) * bracketSlotStep) / 2;
  }

  private bracketConnector(match: TournamentMatch, cards: Map<string, { x: number; y: number }>): string | null {
    if (!match.nextRound || !match.nextBracketPosition) {
      return null;
    }

    const source = cards.get(`${match.round}:${match.bracketPosition}`);
    const target = cards.get(`${match.nextRound}:${match.nextBracketPosition}`);

    if (!source || !target) {
      return null;
    }

    const startX = source.x + bracketCardWidth;
    const startY = source.y + bracketCardHeight / 2;
    const endX = target.x;
    const endY = target.y + bracketCardHeight / 2;
    const middleX = startX + (endX - startX) / 2;

    return `M ${startX} ${startY} H ${middleX} V ${endY} H ${endX}`;
  }
}
