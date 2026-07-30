import assert from 'node:assert/strict';
import test from 'node:test';
import { getBadgeStudioCopy } from './badgeStudioCopy.js';

test('badge studio selects a complete Chinese interface without changing the English default', () => {
  const english = getBadgeStudioCopy('en');
  const chinese = getBadgeStudioCopy('zh');

  assert.equal(english.title, 'Badge Studio');
  assert.equal(english.steps.join(','), 'Upload,Customize,Arrange,Details,Finish');
  assert.equal(chinese.designs.quality.good, '良好');
  assert.equal(chinese.title, '徽章设计室');
  assert.equal(chinese.steps.join(','), '上传,调整,排版,资料,完成');
  assert.equal(chinese.upload.choosePhotos, '选择照片');
  assert.equal(chinese.canvas.replacePhoto, '更换照片');
  assert.equal(chinese.arrange.empty, '空白');
  assert.equal(chinese.details.name, '姓名 *');
  assert.equal(chinese.finish.contactWhatsapp, '通过 WhatsApp 联系 Ashlife');
  assert.deepEqual(chinese.reset, {
    button: '全部重置',
    dialogAria: '重置徽章设计',
    title: '要重置这个徽章设计吗？',
    description: '此设备上保存的所有照片、徽章设计、数量、订单资料和生成文件都会被删除。此操作无法撤销。',
    cancel: '否，保留设计',
    confirm: '是，全部重置',
    working: '正在重置…',
    failed: '无法重置此设计。您的内容仍然安全保留。',
  });
  assert.equal(english.reset.button, 'Reset all');
  assert.equal(english.reset.cancel, 'No, keep it');
  assert.equal(english.reset.confirm, 'Yes, reset all');
});

test('badge studio falls back to English for an unsupported language', () => {
  assert.equal(getBadgeStudioCopy('ms').title, 'Badge Studio');
});
