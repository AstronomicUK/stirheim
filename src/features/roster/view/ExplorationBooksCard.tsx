import { useState } from 'react'
import { type WarbandDetail, warbandKeys } from '../../../api/warbands'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../api/supabase'
import { availableExplorationBooks, EXPLORATION_BOOKS, type ExplorationBookId } from '../../../rules/resolve/explorationBooks'
import { Button, Notice, SelectField } from '../../../ui'
import { Card, Section } from './bits'

export function ExplorationBooksCard({detail,canEdit,onError}:{detail:WarbandDetail;canEdit:boolean;onError:(message:string|null)=>void}) {
  const [selected,setSelected]=useState<ExplorationBookId|''>('')
  const [readerId,setReaderId]=useState('')
  const qc=useQueryClient()
  const update=useMutation({mutationFn:async({book,hero}:{book:ExplorationBookId;hero:string})=>{const result=await supabase.rpc('study_exploration_book',{p_warband_id:detail.warband.id,p_hero_id:hero,p_book_id:book});if(result.error)throw new Error(result.error.message)},onSuccess:()=>qc.invalidateQueries({queryKey:warbandKeys.all})})
  const books=availableExplorationBooks(detail.roster)
  if(!canEdit||!books.length)return null
  const bookId=selected&&books.includes(selected)?selected:books[0]
  const book=EXPLORATION_BOOKS[bookId]
  const readers=detail.roster.heroes.filter(h=>h.status==='active'&&!h.flags[book.flag])
  const reader=readers.find(h=>h.id===readerId)
  return <Section title="Study an exploration book"><Card className="flex flex-col gap-3">
    <SelectField label="Book to study" value={bookId} onChange={e=>{setSelected(e.target.value as ExplorationBookId);setReaderId('')}}>{books.map(id=><option key={id} value={id}>{EXPLORATION_BOOKS[id].name}</option>)}</SelectField>
    <p className="text-sm">{book.benefit} This uses one copy for one Hero instead of selling it. It grants no immediate skill or characteristic increase.</p>
    <SelectField label="Hero studying the book" value={reader?.id??''} onChange={e=>setReaderId(e.target.value)}><option value="">Choose a Hero…</option>{readers.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
    {!readers.length?<Notice>No living Hero still needs this book’s benefit.</Notice>:null}
    <Button disabled={!reader} pending={update.isPending} onClick={async()=>{
      if(!reader)return
      onError(null)
      try {
        await update.mutateAsync({book:bookId,hero:reader.id})
        setReaderId('')
      } catch(error) {onError(error instanceof Error?error.message:'Could not record the study.')}
    }}>Record study</Button>
  </Card></Section>
}
