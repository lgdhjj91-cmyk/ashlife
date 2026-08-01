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
  assert.equal(chinese.canvas.cutEdge, '裁切边缘 70 mm');
  assert.equal(chinese.canvas.frontFace, '徽章正面 58 mm');
  assert.equal(chinese.canvas.safeArea, '安全内容 54 mm');
  assert.equal(chinese.canvas.wrapArea, '包边区域');
  assert.equal(chinese.canvas.frontPreviewTitle, '成品正面预览');
  assert.match(chinese.canvas.wrapExplanation, /包到徽章侧面/);
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
  assert.equal(english.canvas.cutEdge, 'Cut edge 70 mm');
  assert.equal(english.canvas.frontFace, 'Finished front 58 mm');
  assert.equal(english.canvas.safeArea, 'Safe content 54 mm');
  assert.equal(english.canvas.wrapArea, 'Wrap area');
  assert.equal(english.canvas.frontPreviewTitle, 'Finished badge front');
  assert.match(english.canvas.wrapExplanation, /wraps around the badge side/);
  assert.deepEqual(english.productionGuide, {
    eyebrow: 'Important before designing',
    title: 'Know what stays on your badge',
    description: 'Your photo is printed larger than the finished badge because the outer band wraps around the edge.',
    cutTitle: '70 mm cut artwork',
    cutDescription: 'Fill the photo or background all the way to this edge.',
    frontTitle: '58 mm finished front',
    frontDescription: 'This center circle stays visible on the finished badge.',
    safeTitle: '54 mm safe content',
    safeDescription: 'Keep faces, text, and logos inside this area.',
  });
  assert.equal(chinese.productionGuide.title, '先了解徽章的显示范围');
  assert.equal(chinese.productionGuide.cutTitle, '70 mm 裁切图稿');
  assert.match(chinese.productionGuide.description, /外圈会包到徽章侧边/);
  assert.equal(chinese.productionGuide.safeDescription, '请把人脸、文字和标志保留在这个范围内。');
});

test('badge studio falls back to English for an unsupported language', () => {
  assert.equal(getBadgeStudioCopy('ms').title, 'Badge Studio');
});
