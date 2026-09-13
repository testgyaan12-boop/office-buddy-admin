import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, RefreshCw, Search, Send, ArrowLeft, Image as ImageIcon, Users, Link2, UserPlus, Check, X, MessageSquare, Paperclip } from 'lucide-react';
import { api } from '../api';

interface OnlineUser { id: string; name: string; email: string; avatarUrl?: string; }
interface Conversation {
  id: string; userAId: string; userBId: string;
  userAName?: string; userAEmail?: string; userAAvatar?: string;
  userBName?: string; userBEmail?: string; userBAvatar?: string;
  userAOnline: boolean; userBOnline: boolean;
  lastMessage?: string; lastMessageAt?: string;
}
interface Connection {
  userAId: string; userAName?: string; userAEmail?: string; userAOnline: boolean;
  userBId: string; userBName?: string; userBEmail?: string; userBOnline: boolean;
}
interface ChatMessage {
  id: string; conversationId?: string; groupId?: string; senderId: string;
  content?: string; type: string; fileUrl?: string; linkUrl?: string; readAt?: string;
  createdAt?: string; senderName?: string; senderEmail?: string; senderAvatar?: string;
}
interface ChatGroup {
  id: string; name: string; description?: string; groupAvatar?: string;
  adminId: string; pendingCount: number; memberCount: number; rejectedCount: number;
  createdAt?: string; isActive: number;
}
interface GroupMember {
  id: string; groupId: string; userId: string; status: string;
  userName?: string; userEmail?: string; createdAt?: string;
}

const AVATAR_TONES = ['from-violet-500 to-purple-600','from-blue-500 to-cyan-500','from-green-500 to-emerald-500','from-amber-500 to-orange-500','from-rose-500 to-pink-500','from-indigo-500 to-blue-500'];
function tone(name: string): string { let h = 0; for (let i = 0; i < (name||'').length; i++) h = name.charCodeAt(i)+((h<<5)-h); return AVATAR_TONES[Math.abs(h)%AVATAR_TONES.length]; }
function timeAgo(iso?: string): string { if (!iso) return ''; const ms = Date.now()-Date.parse(iso); if (ms<0) return 'Just now'; const s=Math.floor(ms/1000); if(s<60) return `${s}s`; const m=Math.floor(s/60); if(m<60) return `${m}m`; const hr=Math.floor(m/60); if(hr<24) return `${hr}h`; return `${Math.floor(hr/24)}d`; }
function formatTime(iso?: string): string { if (!iso) return ''; return new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}); }

function UserAvatar({ name, avatar, online, size='h-10 w-10' }: { name: string; avatar?: string; online?: boolean; size?: string }) {
  return (
    <div className="relative shrink-0">
      {avatar ? <img src={avatar} className={`${size} rounded-full object-cover`} alt="" /> : <span className={`flex ${size} items-center justify-center rounded-full bg-gradient-to-br ${tone(name)} text-xs font-bold text-white`}>{name[0]?.toUpperCase()||'?'}</span>}
      {online !== undefined && <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${online?'bg-green-500':'bg-slate-300 dark:bg-slate-600'}`} />}
    </div>
  );
}

function MessageBubble({ m }: { m: ChatMessage }) {
  const [imgOpen, setImgOpen] = useState(false);
  const isImage = (m.type === 'IMAGE' || m.type === 'FILE') && m.fileUrl;
  const isLink = m.type === 'LINK' && m.linkUrl;

  return (
    <>
      <div className="flex gap-2.5 group">
        <UserAvatar name={m.senderName||'?'} avatar={m.senderAvatar} size="h-7 w-7"/>
        <div className="min-w-0 max-w-[75%]">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-ink dark:text-white">{m.senderName}</span>
            <span className="text-[10px] text-muted">{formatTime(m.createdAt)}</span>
          </div>
          {isImage ? (
            <button onClick={()=>setImgOpen(true)} className="mt-1 block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <img src={m.fileUrl} alt="" className="max-h-48 w-auto rounded-xl object-cover transition hover:scale-[1.02]"/>
            </button>
          ) : isLink ? (
            <a href={m.linkUrl} target="_blank" rel="noreferrer" className="mt-1 block rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 transition hover:shadow-md dark:border-violet-800 dark:bg-violet-950/30">
              <div className="flex items-center gap-2 text-xs"><Link2 size={14} className="text-violet-500 shrink-0"/><span className="truncate text-violet-700 underline dark:text-violet-300">{m.content || m.linkUrl}</span></div>
            </a>
          ) : (
            <div className="mt-0.5 rounded-xl bg-slate-100 px-3 py-2 text-[13px] text-ink dark:bg-slate-800 dark:text-white">{m.content}</div>
          )}
          {m.readAt && <span className="text-[9px] text-muted">Read</span>}
        </div>
      </div>
      {imgOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={()=>setImgOpen(false)}>
          <img src={m.fileUrl} className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" alt="" onClick={e=>e.stopPropagation()}/>
          <button onClick={()=>setImgOpen(false)} className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"><X size={20}/></button>
        </div>
      )}
    </>
  );
}

type SideTab = 'chats' | 'connections' | 'groups';

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sideTab, setSideTab] = useState<SideTab>('chats');
  const [replyText, setReplyText] = useState('');
  const [replyConfirm, setReplyConfirm] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [sending, setSending] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [pendingImage, setPendingImage] = useState<File[]|null>(null);
  const [pendingImagePreviews, setPendingImagePreviews] = useState<string[]>([]);
  const [attachLink, setAttachLink] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachTarget, setAttachTarget] = useState<'dm'|'group'>('dm');
  const messagesEnd = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group state
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [groupMsgLoading, setGroupMsgLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupTab, setGroupTab] = useState<'members' | 'pending' | 'messages'>('members');
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean; groupId: string; name: string}>({open: false, groupId: '', name: ''});
  const [removeConfirm, setRemoveConfirm] = useState<{open: boolean; groupId: string; memberId: string; name: string}>({open: false, groupId: '', memberId: '', name: ''});
  const groupMessagesEnd = useRef<HTMLDivElement>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [convRes, onlineRes, connRes, groupRes] = await Promise.all([
        api.get('/admin/chat/conversations'), api.get('/admin/chat/online'),
        api.get('/admin/chat/connections'), api.get('/admin/groups'),
      ]);
      setConversations(Array.isArray(convRes.data) ? convRes.data : []);
      setOnlineUsers(Array.isArray(onlineRes.data) ? onlineRes.data : []);
      setConnections(Array.isArray(connRes.data) ? connRes.data : []);
      setGroups(Array.isArray(groupRes.data) ? groupRes.data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadDmMessages = useCallback(async () => {
    if (!selected) return;
    setMsgLoading(true);
    try { const r = await api.get(`/admin/chat/conversations/${selected.id}/messages`); setMessages(Array.isArray(r.data)?r.data:[]); } catch {}
    setMsgLoading(false);
  }, [selected]);

  useEffect(() => { loadDmMessages(); }, [loadDmMessages]);
  useEffect(() => { messagesEnd.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);
  useEffect(() => { groupMessagesEnd.current?.scrollIntoView({behavior:'smooth'}); }, [groupMessages]);

  useEffect(() => {
    if (!selectedGroup) return;
    loadGroupMembers(selectedGroup.id);
    loadGroupMessages(selectedGroup.id);
  }, [selectedGroup]);

  const loadGroupMembers = async (gid: string) => {
    try { const r = await api.get(`/admin/groups/${gid}/members`); setGroupMembers(Array.isArray(r.data)?r.data:[]); } catch {}
  };
  const loadGroupMessages = async (gid: string) => {
    setGroupMsgLoading(true);
    try { const r = await api.get(`/admin/groups/${gid}/messages`); setGroupMessages(Array.isArray(r.data)?r.data:[]); } catch {}
    setGroupMsgLoading(false);
  };

  const openAttach = (target: 'dm'|'group') => { setAttachTarget(target); setAttachOpen(true); };

  const handleAttachImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newFiles = Array.from(files);
    setPendingImage(prev => prev ? [...prev, ...newFiles] : newFiles);
    setPendingImagePreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeAttachImage = (idx: number) => {
    setPendingImage(prev => prev ? prev.filter((_,i) => i!==idx) : null);
    setPendingImagePreviews(prev => prev.filter((_,i) => i!==idx));
  };

  const hasAttachContent = () => (pendingImagePreviews.length > 0) || attachLink.trim();

  const handleSendClick = () => {
    if (!replyText.trim() && !hasAttachContent()) return;
    if (pendingImage && pendingImage.length > 0) { setAttachOpen(true); setAttachTarget('dm'); return; }
    setReplyConfirm(true); setSecretKey(''); setKeyError('');
  };

  const handleConfirmSend = async () => {
    if (secretKey !== '1234') { setKeyError('Invalid secret key'); return; }
    await doSendDm(secretKey);
  };

  const doSendDm = async (key: string) => {
    if (!selected) return;
    setSending(true);
    try {
      if (pendingImage && pendingImage.length > 0) {
        for (const file of pendingImage) {
          const fd = new FormData(); fd.append('file', file);
          const upRes = await api.post('/admin/chat/upload', fd, {headers:{'Content-Type':'multipart/form-data'}});
          await api.post(`/admin/chat/conversations/${selected.id}/send`, {content: '', type: 'IMAGE', fileUrl: upRes.data.url}, {headers:{'X-Admin-Key':key}});
        }
        setPendingImage(null); setPendingImagePreviews([]);
      }
      if (attachLink.trim()) {
        await api.post(`/admin/chat/conversations/${selected.id}/send`, {content: attachLink, type: 'LINK', fileUrl: attachLink}, {headers:{'X-Admin-Key':key}});
        setAttachLink('');
      }
      if (replyText.trim() && !(pendingImage && pendingImage.length > 0) && !attachLink.trim()) {
        await api.post(`/admin/chat/conversations/${selected.id}/send`, {content: replyText, type: 'TEXT'}, {headers:{'X-Admin-Key':key}});
      }
      setReplyText(''); setReplyConfirm(false); setSecretKey(''); setAttachOpen(false);
      await loadDmMessages();
    } catch (e: any) { setKeyError(e?.response?.data?.message||'Failed'); } finally { setSending(false); }
  };

  const handleGroupReply = async () => {
    if ((!replyText.trim() && !hasAttachContent()) || !selectedGroup) return;
    setSending(true);
    try {
      if (pendingImage && pendingImage.length > 0) {
        for (const file of pendingImage) {
          const fd = new FormData(); fd.append('file', file);
          const upRes = await api.post('/admin/groups/upload', fd, {headers:{'Content-Type':'multipart/form-data'}});
          await api.post(`/admin/groups/${selectedGroup.id}/send`, {content: '', type: 'IMAGE', fileUrl: upRes.data.url}, {headers:{'X-Admin-Key':'1234'}});
        }
        setPendingImage(null); setPendingImagePreviews([]);
      }
      if (attachLink.trim()) {
        await api.post(`/admin/groups/${selectedGroup.id}/send`, {content: attachLink, type: 'LINK', fileUrl: attachLink}, {headers:{'X-Admin-Key':'1234'}});
        setAttachLink('');
      }
      if (replyText.trim() && !(pendingImage && pendingImage.length > 0) && !attachLink.trim()) {
        await api.post(`/admin/groups/${selectedGroup.id}/send`, {content: replyText}, {headers:{'X-Admin-Key':'1234'}});
      }
      setReplyText(''); setAttachOpen(false);
      loadGroupMessages(selectedGroup.id);
    } catch {}
    setSending(false);
  };

  // Group handlers
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    try {
      await api.post('/admin/groups', {name: newGroupName, description: newGroupDesc});
      setShowCreateGroup(false); setNewGroupName(''); setNewGroupDesc('');
      const r = await api.get('/admin/groups'); setGroups(Array.isArray(r.data)?r.data:[]);
    } catch {}
    setCreatingGroup(false);
  };
  const handleDeleteGroup = async () => {
    const { groupId } = deleteConfirm;
    try { await api.delete(`/admin/groups/${groupId}`); setGroups(g => g.filter(x => x.id !== groupId)); if (selectedGroup?.id === groupId) setSelectedGroup(null); } catch {}
    setDeleteConfirm({open: false, groupId: '', name: ''});
  };
  const handleMemberStatus = async (groupId: string, memberId: string, status: string) => {
    try { await api.put(`/admin/groups/${groupId}/members/${memberId}`, {status}); loadGroupMembers(groupId); const r = await api.get('/admin/groups'); setGroups(Array.isArray(r.data)?r.data:[]); } catch {}
  };
  const handleRemoveMember = async () => {
    const { groupId, memberId } = removeConfirm;
    try { await api.delete(`/admin/groups/${groupId}/members/${memberId}`); loadGroupMembers(groupId); } catch {}
    setRemoveConfirm({open: false, groupId: '', memberId: '', name: ''});
  };

  const getOther = (c: Conversation) => ({ name: c.userAName||c.userBName||'User', email: c.userAEmail||c.userBEmail||'', avatar: c.userAAvatar||c.userBAvatar, online: c.userAOnline||c.userBOnline });
  const filteredConvos = conversations.filter(c => { if (!search.trim()) return true; const ql=search.toLowerCase(); const o=getOther(c); return o.name.toLowerCase().includes(ql)||o.email.toLowerCase().includes(ql); });
  const filteredConns = connections.filter(c => { if (!search.trim()) return true; const ql=search.toLowerCase(); return (c.userAName||'').toLowerCase().includes(ql)||(c.userBName||'').toLowerCase().includes(ql); });
  const filteredGroups = groups.filter(g => { if (!search.trim()) return true; return g.name.toLowerCase().includes(search.toLowerCase()); });

  return (
    <div className="flex h-[calc(100vh-90px)] gap-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Sidebar */}
      <div className={`flex w-80 flex-col border-r border-slate-100 dark:border-slate-800 ${(selected||selectedGroup)?'hidden lg:flex':'flex'}`}>
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><MessageCircle size={18} className="text-violet-600"/><h2 className="text-sm font-bold text-ink dark:text-white">Chat</h2></div>
            <button onClick={loadAll} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={14}/></button>
          </div>
          <div className="mt-2.5 flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            {([['chats',MessageCircle,'Chats'],['connections',Link2,'Connections'],['groups',Users,'Groups']] as const).map(([k,Icon,label])=>(
              <button key={k} onClick={()=>{setSideTab(k);setSelected(null);setSelectedGroup(null);}} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition ${sideTab===k?'bg-white text-violet-600 shadow-sm dark:bg-slate-700 dark:text-violet-400':'text-muted hover:text-ink dark:hover:text-white'}`}><Icon size={12}/>{label}</button>
            ))}
          </div>
          <div className="relative mt-2.5">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-ink placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
        </div>
        {onlineUsers.length > 0 && (
          <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <div className="mb-2 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"/><span className="text-[10px] font-bold uppercase tracking-wider text-muted">Online — {onlineUsers.length}</span></div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">{onlineUsers.map(u=>(<div key={u.id} className="flex flex-col items-center gap-0.5"><UserAvatar name={u.name} avatar={u.avatarUrl} online size="h-8 w-8"/><span className="max-w-[48px] truncate text-[9px] text-muted">{u.name.split(' ')[0]}</span></div>))}</div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {loading ? Array.from({length:5}).map((_,i)=>(<div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse"><div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800"/><div className="flex-1 space-y-1.5"><div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800"/><div className="h-2.5 w-36 rounded bg-slate-100 dark:bg-slate-800"/></div></div>))
          : sideTab==='chats' ? (filteredConvos.length===0 ? <div className="px-4 py-8 text-center text-xs text-muted">No conversations</div> :
            filteredConvos.map(c => { const o=getOther(c); return (<button key={c.id} onClick={()=>{setSelected(c);setSelectedGroup(null);}} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${selected?.id===c.id?'bg-violet-50 dark:bg-violet-950/30':''}`}><UserAvatar name={o.name} avatar={o.avatar} online={o.online}/><div className="min-w-0 flex-1"><div className="flex items-center justify-between"><span className="truncate text-sm font-semibold text-ink dark:text-white">{o.name}</span><span className="shrink-0 text-[10px] text-muted">{timeAgo(c.lastMessageAt)}</span></div><span className="block truncate text-[11px] text-muted">{c.lastMessage||'No messages'}</span></div></button>); })
          ) : sideTab==='connections' ? (filteredConns.length===0 ? <div className="px-4 py-8 text-center text-xs text-muted">No connections</div> :
            filteredConns.map((c,i)=>(<div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/50"><div className="flex items-center gap-2 flex-1 min-w-0"><UserAvatar name={c.userAName||'?'} online={c.userAOnline} size="h-8 w-8"/><div className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-ink dark:text-white">{c.userAName}</span><span className="block truncate text-[10px] text-muted">{c.userAEmail}</span></div></div><Link2 size={11} className="text-violet-400 shrink-0"/><div className="flex items-center gap-2 flex-1 min-w-0 justify-end"><div className="min-w-0 flex-1 text-right"><span className="block truncate text-xs font-semibold text-ink dark:text-white">{c.userBName}</span><span className="block truncate text-[10px] text-muted">{c.userBEmail}</span></div><UserAvatar name={c.userBName||'?'} online={c.userBOnline} size="h-8 w-8"/></div></div>))
          ) : (<>
              <button onClick={()=>setShowCreateGroup(true)} className="mx-4 mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 py-2.5 text-xs font-semibold text-violet-600 transition hover:bg-violet-50 dark:hover:bg-violet-950/30"><UserPlus size={14}/>Create Group</button>
              {filteredGroups.length===0 ? <div className="px-4 py-8 text-center text-xs text-muted">No groups</div> :
              filteredGroups.map(g=>(<button key={g.id} onClick={()=>{setSelectedGroup(g);setSelected(null);setGroupTab('members');}} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${selectedGroup?.id===g.id?'bg-violet-50 dark:bg-violet-950/30':''}`}><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white">{g.name[0]?.toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between"><span className="truncate text-sm font-semibold text-ink dark:text-white">{g.name}</span>{g.pendingCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">{g.pendingCount}</span>}</div><span className="block text-[11px] text-muted">{g.memberCount} members</span></div></button>))}
            </>)}
        </div>
      </div>

      {/* Chat / Group Area */}
      <div className={`flex flex-1 flex-col ${(selected||selectedGroup)?'flex':'hidden lg:flex'}`}>
        {selected ? (<>
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <button onClick={()=>setSelected(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"><ArrowLeft size={18}/></button>
              <UserAvatar name={getOther(selected).name} avatar={getOther(selected).avatar} online={getOther(selected).online} size="h-9 w-9"/>
              <div className="flex-1"><div className="text-sm font-bold text-ink dark:text-white">{getOther(selected).name}</div><div className="text-[11px] text-muted">{getOther(selected).online?'Online':'Offline'}</div></div>
              <button onClick={loadDmMessages} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Refresh"><RefreshCw size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {msgLoading ? <div className="flex items-center justify-center py-12 text-xs text-muted">Loading...</div> :
              messages.length===0 ? <div className="flex flex-col items-center justify-center py-12"><MessageCircle size={32} className="text-slate-300 dark:text-slate-600"/><p className="mt-2 text-xs text-muted">No messages</p></div> :
              <div className="space-y-3">{messages.map(m=><MessageBubble key={m.id} m={m}/>)}
              <div ref={messagesEnd}/></div>}
            </div>
            {/* DM Input */}
            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button onClick={()=>openAttach('dm')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-violet-300 hover:text-violet-500 dark:border-slate-700" title="Attach"><Paperclip size={16}/></button>
                <input value={replyText} onChange={e=>setReplyText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendClick()} placeholder="Type a reply..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
                <button onClick={handleSendClick} disabled={!replyText.trim()&&!hasAttachContent()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 text-white transition hover:shadow-md disabled:opacity-40"><Send size={16}/></button>
              </div>
            </div>
        </>) : selectedGroup ? (<>
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <button onClick={()=>setSelectedGroup(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"><ArrowLeft size={18}/></button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white">{selectedGroup.name[0]?.toUpperCase()}</div>
              <div className="flex-1"><div className="text-sm font-bold text-ink dark:text-white">{selectedGroup.name}</div><div className="text-[11px] text-muted">{selectedGroup.memberCount} members · {selectedGroup.pendingCount} pending</div></div>
              <button onClick={()=>setDeleteConfirm({open:true,groupId:selectedGroup.id,name:selectedGroup.name})} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">Delete</button>
            </div>
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              {([['members',Users,'Members'],['pending',UserPlus,`Pending (${selectedGroup.pendingCount})`],['messages',MessageSquare,'Messages']] as const).map(([k,Icon,label])=>(
                <button key={k} onClick={()=>setGroupTab(k)} className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${groupTab===k?'border-violet-500 text-violet-600 dark:text-violet-400':'border-transparent text-muted hover:text-ink dark:hover:text-white'}`}><Icon size={13}/>{label}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {groupTab==='members' && (<div className="space-y-2">
                {groupMembers.filter(m=>m.status==='APPROVED').length===0 && <p className="text-xs text-muted text-center py-6">No members yet</p>}
                {groupMembers.filter(m=>m.status==='APPROVED').map(m=>(<div key={m.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60"><UserAvatar name={m.userName||'?'} size="h-9 w-9"/><div className="flex-1 min-w-0"><span className="block truncate text-sm font-semibold text-ink dark:text-white">{m.userName}</span><span className="block truncate text-[11px] text-muted">{m.userEmail}</span></div><button onClick={()=>setRemoveConfirm({open:true,groupId:selectedGroup.id,memberId:m.id,name:m.userName||'this user'})} className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">Remove</button></div>))}
              </div>)}
              {groupTab==='pending' && (<div className="space-y-2">
                {groupMembers.filter(m=>m.status==='PENDING').length===0 && <p className="text-xs text-muted text-center py-6">No pending requests</p>}
                {groupMembers.filter(m=>m.status==='PENDING').map(m=>(<div key={m.id} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30"><UserAvatar name={m.userName||'?'} size="h-9 w-9"/><div className="flex-1 min-w-0"><span className="block truncate text-sm font-semibold text-ink dark:text-white">{m.userName}</span><span className="block truncate text-[11px] text-muted">{m.userEmail}</span></div><button onClick={()=>handleMemberStatus(selectedGroup.id,m.id,'APPROVED')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-white transition hover:bg-green-600"><Check size={14}/></button><button onClick={()=>handleMemberStatus(selectedGroup.id,m.id,'REJECTED')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600"><X size={14}/></button></div>))}
              </div>)}
              {groupTab==='messages' && (<>
                <div className="flex items-center justify-end mb-2"><button onClick={()=>loadGroupMessages(selectedGroup.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={12}/>Refresh</button></div>
                {groupMsgLoading ? <div className="text-center text-xs text-muted py-6">Loading...</div> :
                groupMessages.length===0 ? <div className="text-center text-xs text-muted py-6">No messages yet</div> :
                <div className="space-y-3">{groupMessages.map(m=><MessageBubble key={m.id} m={m}/>)}
                <div ref={groupMessagesEnd}/></div>}
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={()=>openAttach('group')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-violet-300 hover:text-violet-500 dark:border-slate-700" title="Attach"><Paperclip size={16}/></button>
                  <input value={replyText} onChange={e=>setReplyText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleGroupReply()} placeholder="Type a message..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-violet-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
                  <button onClick={handleGroupReply} disabled={(!replyText.trim()&&!hasAttachContent())||sending} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 text-white disabled:opacity-40"><Send size={16}/></button>
                </div>
              </>)}
            </div>
        </>) : (
          <div className="flex flex-1 flex-col items-center justify-center"><MessageCircle size={48} className="text-slate-200 dark:text-slate-700"/><p className="mt-3 text-sm font-semibold text-slate-400">Select a conversation or group</p><p className="text-xs text-muted">Choose from the left to get started</p></div>
        )}
      </div>

      {/* Secret Key Confirmation Modal */}
      {replyConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={()=>!sending&&setReplyConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={e=>e.stopPropagation()}>
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800"><h3 className="text-lg font-bold text-ink dark:text-white">Confirm Reply</h3><p className="mt-0.5 text-xs text-muted">Enter secret key to send</p></div>
            <div className="px-6 py-5 space-y-3">
              {pendingImagePreviews.length > 0 && <div className="flex gap-1 flex-wrap">{pendingImagePreviews.map((p,i)=><img key={i} src={p} className="h-12 w-12 rounded-lg object-cover"/>)}</div>}
              {replyText && <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-ink dark:bg-slate-800 dark:text-white">{replyText}</div>}
              {attachLink && <div className="rounded-xl bg-violet-50 px-3.5 py-2.5 text-xs text-violet-700 truncate dark:bg-violet-950/30 dark:text-violet-300">{attachLink}</div>}
              <div><label className="mb-1 block text-xs font-semibold text-muted">Secret Key</label>
              <input type="password" value={secretKey} onChange={e=>{setSecretKey(e.target.value);setKeyError('');}} onKeyDown={e=>e.key==='Enter'&&handleConfirmSend()} placeholder="Enter secret key..." autoFocus className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
              {keyError&&<p className="mt-1 text-xs text-red-500">{keyError}</p>}</div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button disabled={sending} onClick={()=>{setReplyConfirm(false);setPendingImage(null);setPendingImagePreviews([]);setAttachLink('');}} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button disabled={sending||!secretKey} onClick={handleConfirmSend} className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-2.5 text-sm font-semibold text-white hover:shadow-md disabled:opacity-50">{sending?'Sending...':'Confirm & Send'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={()=>setShowCreateGroup(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={e=>e.stopPropagation()}>
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800"><h3 className="text-lg font-bold text-ink dark:text-white">Create Group</h3><p className="mt-0.5 text-xs text-muted">Create a new group chat</p></div>
            <div className="px-6 py-5 space-y-4">
              <div><label className="mb-1 block text-xs font-semibold text-muted">Group Name</label><input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} placeholder="e.g. Tech Team" autoFocus className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"/></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted">Description</label><textarea value={newGroupDesc} onChange={e=>setNewGroupDesc(e.target.value)} placeholder="What's this group about?" rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"/></div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button onClick={()=>setShowCreateGroup(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button disabled={!newGroupName.trim()||creatingGroup} onClick={handleCreateGroup} className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-2.5 text-sm font-semibold text-white hover:shadow-md disabled:opacity-50">{creatingGroup?'Creating...':'Create Group'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirm */}
      {deleteConfirm.open && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={()=>setDeleteConfirm({open:false,groupId:'',name:''})}><div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={e=>e.stopPropagation()}><div className="px-6 pt-6 pb-2 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"><svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></div><h3 className="text-lg font-bold text-ink dark:text-white">Delete Group</h3><p className="mt-1 text-sm text-muted">Delete <span className="font-semibold text-ink dark:text-white">"{deleteConfirm.name}"</span>?</p></div><div className="flex gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800"><button onClick={()=>setDeleteConfirm({open:false,groupId:'',name:''})} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button><button onClick={handleDeleteGroup} className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 py-2.5 text-sm font-semibold text-white hover:shadow-md">Delete</button></div></div></div>)}

      {/* Remove Member Confirm */}
      {removeConfirm.open && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={()=>setRemoveConfirm({open:false,groupId:'',memberId:'',name:''})}><div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={e=>e.stopPropagation()}><div className="px-6 pt-6 pb-2 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30"><svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/></svg></div><h3 className="text-lg font-bold text-ink dark:text-white">Remove Member</h3><p className="mt-1 text-sm text-muted">Remove <span className="font-semibold text-ink dark:text-white">"{removeConfirm.name}"</span>?</p></div><div className="flex gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800"><button onClick={()=>setRemoveConfirm({open:false,groupId:'',memberId:'',name:''})} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button><button onClick={handleRemoveMember} className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-semibold text-white hover:shadow-md">Remove</button></div></div></div>)}

      {/* Attach Popup — Images + Link */}
      {attachOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={()=>{if(!sending){setAttachOpen(false);setPendingImage(null);setPendingImagePreviews([]);setAttachLink('');}}}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={e=>e.stopPropagation()}>
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-ink dark:text-white">Attach Files</h3>
              <p className="mt-0.5 text-xs text-muted">Select images and optionally add a link</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Image upload area */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Images</label>
                <div className="flex flex-wrap gap-2">
                  {pendingImagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative">
                      <img src={preview} className="h-16 w-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700"/>
                      <button onClick={()=>removeAttachImage(idx)} className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"><X size={8}/></button>
                    </div>
                  ))}
                </div>
                <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={handleAttachImages}/>
                <button onClick={()=>fileInputRef.current?.click()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-xs font-semibold text-muted transition hover:border-violet-400 hover:text-violet-500 dark:border-slate-700">
                  <ImageIcon size={14}/> {pendingImagePreviews.length > 0 ? 'Add more images' : 'Select images'}
                </button>
              </div>
              {/* Optional link */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Link <span className="font-normal text-slate-400">(optional)</span></label>
                <input value={attachLink} onChange={e=>setAttachLink(e.target.value)} placeholder="Paste affiliate/product link..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button disabled={sending} onClick={()=>{setAttachOpen(false);setPendingImage(null);setPendingImagePreviews([]);setAttachLink('');}} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button
                disabled={sending || (!pendingImagePreviews.length && !attachLink.trim())}
                onClick={async () => {
                  setSending(true);
                  try {
                    const target = attachTarget;
                    const prefix = target === 'dm' ? `/admin/chat/conversations/${selected?.id}` : `/admin/groups/${selectedGroup?.id}`;
                    const uploadBase = target === 'dm' ? '/admin/chat/upload' : '/admin/groups/upload';
                    // Upload images
                    if (pendingImage && pendingImage.length > 0) {
                      for (const file of pendingImage) {
                        const fd = new FormData(); fd.append('file', file);
                        const upRes = await api.post(uploadBase, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                        await api.post(`${prefix}/send`, { content: '', type: 'IMAGE', fileUrl: upRes.data.url }, { headers: { 'X-Admin-Key': target === 'dm' ? secretKey || '1234' : '1234' } });
                      }
                      setPendingImage(null); setPendingImagePreviews([]);
                    }
                    // Send link
                    if (attachLink.trim()) {
                      await api.post(`${prefix}/send`, { content: attachLink, type: 'LINK', fileUrl: attachLink }, { headers: { 'X-Admin-Key': target === 'dm' ? secretKey || '1234' : '1234' } });
                      setAttachLink('');
                    }
                    setReplyText(''); setAttachOpen(false);
                    if (target === 'dm') await loadDmMessages(); else loadGroupMessages(selectedGroup!.id);
                  } catch (e: any) { if (attachTarget === 'dm') setKeyError(e?.response?.data?.message || 'Failed'); }
                  setSending(false);
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-2.5 text-sm font-semibold text-white hover:shadow-md disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
