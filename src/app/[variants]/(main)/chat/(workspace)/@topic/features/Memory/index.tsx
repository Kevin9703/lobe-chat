'use client';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { ScrollShadow } from '@lobehub/ui';
import { Empty, Skeleton, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import SidebarHeader from '@/components/SidebarHeader';
import { topicService } from '@/services/topic';
import { LatestAssistantReply } from '@/services/topic/type';
import { useChatStore } from '@/store/chat';
import { useSessionStore } from '@/store/session';
// import { chatSelectors } from '@/store/chat/selectors';
import { sessionSelectors } from '@/store/session/selectors';

const { Paragraph } = Typography;

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return '刚刚';
  if (diffInHours < 24) return `${diffInHours}小时前`;
  if (diffInHours < 48) return '昨天';
  return date.toLocaleDateString('zh-CN', { day: 'numeric', month: 'short' });
};

const useStyles = createStyles(({ css, token }: any) => ({
  animatedContainer: css`
    transition:
      height 0.3s ease,
      opacity 0.3s ease;
  `,

  container: css`
    border-block-end: 1px solid ${token.colorBorderSecondary};
  `,

  content: css`
    margin-block-end: 6px;
    font-size: 13px;
    line-height: 1.4;
    color: ${token.colorTextSecondary};
  `,

  emptyState: css`
    padding-block: 24px;
    padding-inline: 16px;
    text-align: center;
  `,

  memoryItem: css`
    cursor: pointer;

    padding-block: 12px;
    padding-inline: 16px;
    border-block-end: 1px solid ${token.colorBorder};

    transition: background-color 0.2s;

    &:hover {
      background-color: ${token.colorFillTertiary};
    }

    &:last-child {
      border-block-end: none;
    }
  `,

  metadata: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,

  modelInfo: css`
    padding-block: 2px;
    padding-inline: 6px;
    border-radius: 4px;

    font-size: 11px;
    color: ${token.colorTextTertiary};

    background: ${token.colorFillQuaternary};
  `,

  time: css`
    font-size: 11px;
    color: ${token.colorTextTertiary};
  `,

  topicTitle: css`
    margin-block-end: 4px;
    font-weight: 500;
    color: ${token.colorText};
  `,
  userName: css`
    margin-block-end: 6px;
    font-size: 12px;
    color: ${token.colorTextTertiary};
  `,
}));

const Memory = memo(() => {
  const { styles } = useStyles();
  const [replies, setReplies] = useState<LatestAssistantReply[]>([]);
  const [loading, setLoading] = useState(true);

  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const [switchTopic] = useChatStore((s) => [s.switchTopic]);
  // const [chatMessages, isAIGenerating] = useChatStore((s) => [chatSelectors.mainDisplayChats(s), chatSelectors.isAIGenerating(s)]);

  const fetchLatestReplies = async () => {
    if (!currentSession?.id) return;

    setLoading(true);
    try {
      const latestReplies = await (topicService as any).getLatestAssistantRepliesBySession(
        currentSession.id,
      );
      setReplies(latestReplies);
    } catch (error) {
      console.error('获取记忆失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 监听消息变化，当有新的助手回复时更新记忆数据
  // useEffect(() => {
  //   // 如果有消息，并且最后一条消息是助手回复，则更新记忆数据
  //   if (chatMessages.length > 0) {
  //     const lastMessage = chatMessages.at(-1);
  //     if (lastMessage && lastMessage.role === 'assistant' && !isAIGenerating) {
  //       console.log('检测到新的助手回复，更新记忆数据');
  //       fetchLatestReplies();
  //     }
  //   }
  // }, [isAIGenerating]);

  // 初始加载或切换会话时获取记忆数据
  useEffect(() => {
    fetchLatestReplies();
  }, [currentSession?.id]);

  const handleItemClick = (topicId: string) => {
    switchTopic(topicId);
  };

  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (!currentSession?.id) {
    return null;
  }

  return (
    <Flexbox className={styles.container} height={'fit-content'}>
      <SidebarHeader
        actions={expanded ? <UpOutlined /> : <DownOutlined />}
        onClick={toggleExpanded}
        style={{ cursor: 'pointer' }}
        title="记忆"
      />

      <ScrollShadow className={styles.animatedContainer} height={expanded ? 240 : 0}>
        {loading ? (
          <div style={{ padding: '16px' }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '12px 0' }}>
                <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
              </div>
            ))}
          </div>
        ) : replies.length === 0 ? (
          <div className={styles.emptyState}>
            <Empty description="暂无记忆内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <>
            {replies.map((reply) => (
              <div
                className={styles.memoryItem}
                key={reply.id}
                onClick={() => handleItemClick(reply.topicId)}
              >
                <div className={styles.topicTitle}>{reply.topicTitle}</div>
                <div className={styles.userName}>{reply.userName}</div>
                <Paragraph className={styles.content} ellipsis={{ expandable: true, rows: 2 }}>
                  {reply.content}
                </Paragraph>
                <div className={styles.metadata}>
                  {reply.model && <span className={styles.modelInfo}>{reply.model}</span>}
                  <span className={styles.time}>{formatTime(reply.createdAt)}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </ScrollShadow>
    </Flexbox>
  );
});

export default Memory;
